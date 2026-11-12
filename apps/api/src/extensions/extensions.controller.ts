import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Header, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PartialType } from '@nestjs/swagger';
import { IsArray, ArrayMaxSize, ArrayMinSize, IsIn, IsUUID } from 'class-validator';
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { resolve } from 'path';
import QRCode from 'qrcode';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser, Public, Roles } from '../common/auth/decorators';
import { ProfileService } from '../users/profile.service';
import { MatchingService } from '../matching/matching.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateEventDto } from '../events/dto/events.dto';
import { StatsQueryDto } from '../payments/dto/payments.dto';

class PhotoOrderDto { @IsArray() @ArrayMinSize(1) @ArrayMaxSize(6) @IsUUID('all', { each: true }) ids: string[]; }
class UpdateEventDto extends PartialType(CreateEventDto) {}
class CheckInDto { @IsUUID() token: string; }
class SandboxDto { @IsIn(['succeeded', 'canceled']) status: 'succeeded' | 'canceled'; }

@Controller()
export class ExtensionsController {
  constructor(private readonly db: PrismaService, private readonly profiles: ProfileService,
    private readonly matching: MatchingService, private readonly payments: PaymentsService) {}

  @Post('profile/photos/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async upload(@CurrentUser() user: AuthUser, @UploadedFile() file?: { buffer: Buffer }) {
    const b = file?.buffer;
    if (!b) throw new BadRequestException('Выберите файл JPEG, PNG или WebP до 5 МБ');
    const ext = b.subarray(0, 3).equals(Buffer.from([255,216,255])) ? 'jpg' :
      b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'png' :
      b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8,12).toString() === 'WEBP' ? 'webp' : null;
    if (!ext) throw new BadRequestException('Разрешены только JPEG, PNG и WebP');
    const name = `${randomUUID()}.${ext}`;
    const directory = resolve(process.env.MEDIA_DIR || '.local/uploads');
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, name), b, { flag: 'wx' });
    try { return await this.profiles.addPhoto(user.id, `/api/media/${name}`); }
    catch (error) { await unlink(resolve(directory, name)); throw error; }
  }

  @Public() @Get('media/:name') @Header('Cache-Control', 'public, max-age=86400')
  async media(@Param('name') name: string) {
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(name)) throw new NotFoundException();
    const type = name.endsWith('.jpg') ? 'image/jpeg' : name.endsWith('.png') ? 'image/png' : 'image/webp';
    try { return new StreamableFile(await readFile(resolve(process.env.MEDIA_DIR || '.local/uploads', name)), { type }); }
    catch { throw new NotFoundException('Файл не найден'); }
  }

  @Patch('profile/photos/order')
  reorder(@CurrentUser() user: AuthUser, @Body() body: PhotoOrderDto) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT user_id FROM profiles WHERE user_id = ${user.id} FOR UPDATE`;
      const photos = await tx.photo.findMany({ where: { userId: user.id } });
      if (new Set(body.ids).size !== photos.length || body.ids.length !== photos.length || photos.some(p => !body.ids.includes(p.id))) throw new BadRequestException('Нужно передать все свои фото без повторений');
      const offset = Math.max(0, ...photos.map(p => p.position)) + 10;
      for (let i=0;i<body.ids.length;i++) await tx.photo.update({ where: { id: body.ids[i] }, data: { position: offset+i } });
      for (let i=0;i<body.ids.length;i++) await tx.photo.update({ where: { id: body.ids[i] }, data: { position: i } });
      return tx.photo.findMany({ where: { userId: user.id }, orderBy: { position: 'asc' } });
    });
  }

  @Get('matches/:id/meetings')
  async meetings(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.matching.assertParticipant(user.id, id);
    return this.db.meeting.findMany({ where: { matchId: id }, orderBy: { meetAt: 'asc' } });
  }

  @Get('likes/outgoing')
  async outgoing(@CurrentUser() user: AuthUser) {
    const rows = await this.db.like.findMany({ where: { fromUserId: user.id, isLike: true, toUser: { status: 'ACTIVE' } }, orderBy: { createdAt: 'desc' }, take: 100,
      include: { toUser: { select: { id: true, profile: { include: { photos: { orderBy: { position: 'asc' } }, interests: { include: { interest: true } } } } } } } });
    const blocks = await this.db.userBlock.findMany({ where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] } });
    return rows.filter(r => !blocks.some(b => b.blockerId === r.toUserId || b.blockedId === r.toUserId)).map(r => ({ ...r.toUser.profile, userId:r.toUser.id, interests:r.toUser.profile?.interests.map(i=>i.interest.name), likedAt:r.createdAt }));
  }

  @Post('users/:id/block')
  async block(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    if (id === user.id) throw new BadRequestException('Нельзя заблокировать себя');
    if (!await this.db.user.findUnique({ where: { id } })) throw new NotFoundException('Пользователь не найден');
    await this.db.userBlock.upsert({ where: { blockerId_blockedId: { blockerId:user.id, blockedId:id } }, create: { blockerId:user.id, blockedId:id }, update:{} });
    return { blocked:true };
  }
  @Delete('users/:id/block')
  async unblock(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) { await this.db.userBlock.deleteMany({ where: { blockerId:user.id, blockedId:id } });return { blocked:false }; }
  @Get('blocks')
  blocks(@CurrentUser() user: AuthUser) { return this.db.userBlock.findMany({ where: { blockerId:user.id }, include: { blocked: { select: { id:true, profile: { select: { name:true } } } } } }); }

  @Get('events/:id')
  async event(@Param('id', ParseUUIDPipe) id: string) {
    const event = await this.db.event.findUnique({ where:{id}, include:{ partner:true } });
    if (!event?.published) throw new NotFoundException('Событие не найдено');
    const taken = await this.db.ticket.count({ where:{eventId:id,OR:[{status:'PAID'},{status:'RESERVED',reservedUntil:{gt:new Date()}}]} });
    return {...event,freeSeats:Math.max(0,event.capacity-taken)};
  }
  @Roles('ADMIN') @Get('admin/partners')
  partners() {return this.db.partner.findMany({orderBy:{name:'asc'}});}
  @Roles('ADMIN') @Get('admin/events')
  async events() { const list=await this.db.event.findMany({include:{partner:true},orderBy:{startsAt:'desc'}});return Promise.all(list.map(async e=>({...e,freeSeats:e.capacity-await this.db.ticket.count({where:{eventId:e.id,OR:[{status:'PAID'},{status:'RESERVED',reservedUntil:{gt:new Date()}}]}})}))); }
  @Roles('ADMIN') @Patch('admin/events/:id')
  async updateEvent(@Param('id',ParseUUIDPipe) id:string,@Body() dto:UpdateEventDto) {
    return this.db.$transaction(async tx=>{
      const rows=await tx.$queryRaw<{event_id:string}[]>`SELECT event_id FROM events WHERE event_id=${id} FOR UPDATE`;
      if(!rows.length)throw new NotFoundException('Событие не найдено');
      if(dto.startsAt&&new Date(dto.startsAt)<=new Date())throw new BadRequestException('Выберите будущую дату');
      if(dto.partnerId&&!await tx.partner.findUnique({where:{id:dto.partnerId}}))throw new BadRequestException('Партнёр не найден');
      const taken=await tx.ticket.count({where:{eventId:id,OR:[{status:'PAID'},{status:'RESERVED',reservedUntil:{gt:new Date()}}]}});
      if(dto.capacity!==undefined&&dto.capacity<taken)throw new ConflictException('Вместимость меньше числа занятых мест');
      return tx.event.update({where:{id},data:{...dto,...(dto.startsAt?{startsAt:new Date(dto.startsAt)}:{})}});
    });
  }
  @Delete('events/:id/tickets')
  async cancelReservation(@CurrentUser() user:AuthUser,@Param('id',ParseUUIDPipe) eventId:string) {
    const t=await this.db.ticket.findUnique({where:{eventId_userId:{eventId,userId:user.id}}});
    if(!t)throw new NotFoundException('Бронь не найдена');
    if(t.status==='PAID')throw new ConflictException('Оплаченный билет требует возврата через организатора');
    const changed=await this.db.ticket.updateMany({where:{eventId,userId:user.id,status:'RESERVED'},data:{status:'RELEASED',reservedUntil:new Date(),paymentId:null}});
    return {released:!!changed.count};
  }
  @Get('tickets/:id/pass')
  async pass(@CurrentUser() user:AuthUser,@Param('id',ParseUUIDPipe) eventId:string) {
    const ticket=await this.db.ticket.findUnique({where:{eventId_userId:{eventId,userId:user.id}}});
    if(!ticket)throw new NotFoundException('Билет не найден');
    if(ticket.status!=='PAID')throw new ConflictException('Билет ещё не оплачен');
    return {token:ticket.passToken,checkedInAt:ticket.checkedInAt,qrDataUrl:await QRCode.toDataURL(ticket.passToken,{width:256,margin:2})};
  }
  @Roles('ADMIN') @Post('admin/tickets/check-in')
  async checkIn(@Body() body:CheckInDto) {
    const result=await this.db.ticket.updateMany({where:{passToken:body.token,status:'PAID',checkedInAt:null},data:{checkedInAt:new Date()}});
    if(!result.count)throw new ConflictException('Билет недействителен или уже использован');
    return {checkedIn:true};
  }
  @Get('payments')
  history(@CurrentUser() user:AuthUser) {return this.db.payment.findMany({where:{userId:user.id},select:{id:true,kind:true,amount:true,status:true,createdAt:true,paidAt:true},orderBy:{createdAt:'desc'},take:100});}
  @Get('payments/:id')
  async payment(@CurrentUser() user:AuthUser,@Param('id',ParseUUIDPipe) id:string) {const p=await this.db.payment.findFirst({where:{id,userId:user.id},select:{id:true,kind:true,amount:true,status:true,confirmationUrl:true,idempotencyKey:true,ticket:{select:{status:true,eventId:true}}}});if(!p)throw new NotFoundException('Платёж не найден');return {...p,confirmationUrl:p.status==='PENDING'?p.confirmationUrl:null,requiresRefund:p.kind==='TICKET'&&p.status==='SUCCEEDED'&&p.ticket?.status!=='PAID'};}
  @Get('subscription')
  async subscription(@CurrentUser() user:AuthUser) {const sub=await this.db.subscription.findFirst({where:{payment:{userId:user.id},endsAt:{gt:new Date()}},orderBy:{endsAt:'desc'},select:{endsAt:true}});return {active:!!sub,endsAt:sub?.endsAt??null,priceKopecks:Number(process.env.PREMIUM_PRICE_KOPECKS||34900)};}
  private sandboxEnabled() {if(process.env.NODE_ENV==='production'||process.env.PAYMENT_PROVIDER!=='fake')throw new NotFoundException();}
  @Post('payments/:id/simulate')
  async simulate(@CurrentUser() user:AuthUser,@Param('id',ParseUUIDPipe) id:string,@Body() dto:SandboxDto) {
    this.sandboxEnabled();const p=await this.db.payment.findFirst({where:{id,userId:user.id}});if(!p)throw new NotFoundException('Платёж не найден');
    await this.payments.handleWebhook({'x-webhook-secret':process.env.PAYMENT_WEBHOOK_SECRET},{providerPaymentId:p.providerPaymentId,status:dto.status});return this.payment(user,id);
  }
  @Public() @Get('payments/:id/sandbox') @Header('Content-Type','text/html; charset=utf-8')
  sandbox(@Param('id',ParseUUIDPipe) id:string) {
    this.sandboxEnabled();return `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>CAMPUS · тестовая оплата</title><style>body{max-width:420px;margin:60px auto;padding:24px;background:#f4dcbc;color:#261812;font:17px Arial}h1{color:#ed0038}button{padding:16px;border:0;border-radius:28px;background:#ed0038;color:white;margin:10px 0;width:100%;font:inherit}</style><h1>Тестовая оплата</h1><p>Локальная песочница. Деньги не списываются, данные карты не нужны.</p><button data-status="succeeded">Подтвердить тестовую оплату</button><button data-status="canceled">Имитировать отказ</button><p id="result"></p><a href="/#payment-pending">Вернуться в CAMPUS</a><script>document.addEventListener('click',async e=>{const status=e.target.dataset.status;if(!status)return;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{const r=await fetch('/api/payments/${id}/simulate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sessionStorage.getItem('campus-token')},body:JSON.stringify({status})});const d=await r.json();document.getElementById('result').textContent=r.ok?'Готово. Вернись в CAMPUS, чтобы посмотреть результат.':d.message;}catch{document.getElementById('result').textContent='Нет соединения с сервером';}finally{document.querySelectorAll('button').forEach(b=>b.disabled=false);}});</script></html>`;
  }
  @Roles('MODERATOR','ADMIN') @Get('admin/reports/:id')
  async report(@Param('id',ParseUUIDPipe) id:string) {
    const r=await this.db.report.findUnique({where:{id},include:{target:{select:{id:true,status:true,profile:{select:{name:true}}}}}});if(!r)throw new NotFoundException('Жалоба не найдена');
    const match=await this.db.match.findFirst({where:{OR:[{userAId:r.authorId,userBId:r.targetId},{userAId:r.targetId,userBId:r.authorId}]}});
    const messages=match?await this.db.message.findMany({where:{matchId:match.id},orderBy:{sentAt:'desc'},take:20}):[];
    return {...r,messages};
  }
  @Roles('ADMIN') @Get('admin/stats/daily')
  async daily(@Query() q:StatsQueryDto) {
    const from=new Date(q.from),to=new Date(q.to);
    if(to<=from||to.getTime()-from.getTime()>366*86400000)throw new BadRequestException('Выберите период от 1 до 366 дней');
    const rows=await this.db.$queryRaw<{day:string;registrations:bigint}[]>`SELECT to_char(created_at + interval '5 hours','YYYY-MM-DD') AS day, count(*) AS registrations FROM users WHERE created_at >= ${from} AND created_at < ${to} GROUP BY day ORDER BY day`;
    return rows.map(r=>({...r,registrations:Number(r.registrations)}));
  }
}
