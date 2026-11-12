import {
  BadRequestException, Body, ConflictException, Controller, Delete, Get, Header, HttpCode, NotFoundException, Param,
  ParseUUIDPipe, Patch, Post, Query, StreamableFile, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiProperty, ApiTags, PartialType,
} from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsUUID } from 'class-validator';
import { randomUUID } from 'crypto';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { resolve } from 'path';
import QRCode from 'qrcode';
import { ApiAuthErrors, ApiErrors } from '../common/api-docs';
import { AuthUser, CurrentUser, Public, Roles } from '../common/auth/decorators';
import { PrismaService } from '../common/prisma.service';
import { CreateEventDto } from '../events/dto/events.dto';
import { MatchingService } from '../matching/matching.service';
import { StatsQueryDto } from '../payments/dto/payments.dto';
import { PaymentsService } from '../payments/payments.service';
import { ProfileService } from '../users/profile.service';

class PhotoOrderDto {
  @ApiProperty({ type: [String], format: 'uuid', description: 'Все свои фото в новом порядке; первое — обложка' })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(6) @IsUUID('all', { each: true })
  ids: string[];
}
class UpdateEventDto extends PartialType(CreateEventDto) {}
class CheckInDto {
  @ApiProperty({ format: 'uuid', description: 'Код из QR билета' })
  @IsUUID()
  token: string;
}
class SandboxDto {
  @ApiProperty({ enum: ['succeeded', 'canceled'] })
  @IsIn(['succeeded', 'canceled'])
  status: 'succeeded' | 'canceled';
}

const MEDIA_DIR = () => resolve(process.env.MEDIA_DIR || '.local/uploads');
/** Бронь занимает место, пока не истекла; оплаченный билет — всегда. */
const takenSeats = (eventId: string) => ({
  eventId, OR: [{ status: 'PAID' as const }, { status: 'RESERVED' as const, reservedUntil: { gt: new Date() } }],
});

/** Тип файла по сигнатуре, а не по имени и Content-Type от клиента. */
function imageExtension(b: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (b.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

/**
 * Методы, добавленные при подключении веб-клиента (см. docs/WEB_INTEGRATION_AUDIT.md).
 * Права проверяет глобальный AuthGuard; административные маршруты дополнительно ограничены ролью.
 */
@ApiTags('Клиент · фото, блокировки, билеты, платежи')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller()
export class ExtensionsController {
  constructor(
    private readonly db: PrismaService,
    private readonly profiles: ProfileService,
    private readonly matching: MatchingService,
    private readonly payments: PaymentsService,
  ) {}

  // ── Фото ─────────────────────────────────────────────────────────────

  @Post('profile/photos/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  @ApiOperation({ summary: '13: загрузить фото с устройства', description: 'JPEG, PNG или WebP до 5 МБ, до 6 фото.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiErrors({ 400: 'Нет файла, неверный формат, анкета не заполнена или уже 6 фото' })
  async upload(@CurrentUser() user: AuthUser, @UploadedFile() file?: { buffer: Buffer }) {
    const b = file?.buffer;
    if (!b) throw new BadRequestException('Выберите файл JPEG, PNG или WebP до 5 МБ');
    const ext = imageExtension(b);
    if (!ext) throw new BadRequestException('Разрешены только JPEG, PNG и WebP');
    const name = `${randomUUID()}.${ext}`;
    await mkdir(MEDIA_DIR(), { recursive: true });
    await writeFile(resolve(MEDIA_DIR(), name), b, { flag: 'wx' });
    try {
      return await this.profiles.addPhoto(user.id, `/api/media/${name}`);
    } catch (error) {
      await unlink(resolve(MEDIA_DIR(), name));
      throw error;
    }
  }

  @Public()
  @Get('media/:name')
  @Header('Cache-Control', 'public, max-age=86400')
  @ApiOperation({ summary: 'Загруженное изображение', description: 'Без входа: имя файла случайное и непредсказуемое.' })
  @ApiErrors({ 404: 'Файл не найден' })
  async media(@Param('name') name: string) {
    if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(name)) throw new NotFoundException();
    const type = name.endsWith('.jpg') ? 'image/jpeg' : name.endsWith('.png') ? 'image/png' : 'image/webp';
    try {
      return new StreamableFile(await readFile(resolve(MEDIA_DIR(), name)), { type });
    } catch {
      throw new NotFoundException('Файл не найден');
    }
  }

  @Patch('profile/photos/order')
  @ApiOperation({ summary: '13: порядок фото и обложка' })
  @ApiErrors({ 400: 'Нужно передать все свои фото без повторений' })
  reorder(@CurrentUser() user: AuthUser, @Body() body: PhotoOrderDto) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT user_id FROM profiles WHERE user_id = ${user.id} FOR UPDATE`;
      const photos = await tx.photo.findMany({ where: { userId: user.id } });
      const valid = new Set(body.ids).size === photos.length && body.ids.length === photos.length
        && photos.every((p) => body.ids.includes(p.id));
      if (!valid) throw new BadRequestException('Нужно передать все свои фото без повторений');
      // Позиции уникальны: сначала уводим во временный диапазон, потом расставляем 0..n-1
      const offset = Math.max(0, ...photos.map((p) => p.position)) + 10;
      for (let i = 0; i < body.ids.length; i++) {
        await tx.photo.update({ where: { id: body.ids[i] }, data: { position: offset + i } });
      }
      for (let i = 0; i < body.ids.length; i++) {
        await tx.photo.update({ where: { id: body.ids[i] }, data: { position: i } });
      }
      return tx.photo.findMany({ where: { userId: user.id }, orderBy: { position: 'asc' } });
    });
  }

  // ── Знакомства ───────────────────────────────────────────────────────

  @Get('matches/:id/meetings')
  @ApiOperation({ summary: '25: встречи в совпадении' })
  @ApiErrors({ 404: 'Совпадение не найдено' })
  async meetings(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.matching.assertParticipant(user.id, id);
    return this.db.meeting.findMany({ where: { matchId: id }, orderBy: { meetAt: 'asc' } });
  }

  @Get('likes/outgoing')
  @ApiOperation({ summary: '22: мои симпатии', description: 'Последние 100 активных, без заблокированных.' })
  async outgoing(@CurrentUser() user: AuthUser) {
    const rows = await this.db.like.findMany({
      where: { fromUserId: user.id, isLike: true, toUser: { status: 'ACTIVE' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        toUser: {
          select: {
            id: true,
            profile: { include: { photos: { orderBy: { position: 'asc' } }, interests: { include: { interest: true } } } },
          },
        },
      },
    });
    const blocks = await this.db.userBlock.findMany({ where: { OR: [{ blockerId: user.id }, { blockedId: user.id }] } });
    const hidden = new Set(blocks.flatMap((b) => [b.blockerId, b.blockedId]));
    return rows.filter((r) => !hidden.has(r.toUserId)).map((r) => ({
      ...r.toUser.profile,
      userId: r.toUser.id,
      interests: r.toUser.profile?.interests.map((i) => i.interest.name),
      likedAt: r.createdAt,
    }));
  }

  @Post('users/:id/block')
  @HttpCode(200)
  @ApiOperation({ summary: 'Заблокировать пользователя', description: 'Пропадает из ленты, симпатий и чатов обоих.' })
  @ApiErrors({ 400: 'Нельзя заблокировать себя', 404: 'Пользователь не найден' })
  async block(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    if (id === user.id) throw new BadRequestException('Нельзя заблокировать себя');
    if (!(await this.db.user.findUnique({ where: { id } }))) throw new NotFoundException('Пользователь не найден');
    await this.db.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: id } },
      create: { blockerId: user.id, blockedId: id },
      update: {},
    });
    return { blocked: true };
  }

  @Delete('users/:id/block')
  @ApiOperation({ summary: 'Снять свою блокировку' })
  async unblock(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    await this.db.userBlock.deleteMany({ where: { blockerId: user.id, blockedId: id } });
    return { blocked: false };
  }

  @Get('blocks')
  @ApiOperation({ summary: 'Мои блокировки' })
  blocks(@CurrentUser() user: AuthUser) {
    return this.db.userBlock.findMany({
      where: { blockerId: user.id },
      include: { blocked: { select: { id: true, profile: { select: { name: true } } } } },
    });
  }

  // ── События и билеты ─────────────────────────────────────────────────

  @Get('events/:id')
  @ApiOperation({ summary: '41: событие', description: 'Только опубликованные; freeSeats учитывает действующие брони.' })
  @ApiErrors({ 404: 'Событие не найдено' })
  async event(@Param('id', ParseUUIDPipe) id: string) {
    const event = await this.db.event.findUnique({ where: { id }, include: { partner: true } });
    if (!event?.published) throw new NotFoundException('Событие не найдено');
    const taken = await this.db.ticket.count({ where: takenSeats(id) });
    return { ...event, freeSeats: Math.max(0, event.capacity - taken) };
  }

  @Roles('ADMIN')
  @Get('admin/partners')
  @ApiOperation({ summary: 'Партнёры', description: 'Роль: ADMIN.' })
  partners() {
    return this.db.partner.findMany({ orderBy: { name: 'asc' } });
  }

  @Roles('ADMIN')
  @Get('admin/events')
  @ApiOperation({ summary: 'Все события, включая черновики', description: 'Роль: ADMIN.' })
  async events() {
    const list = await this.db.event.findMany({ include: { partner: true }, orderBy: { startsAt: 'desc' } });
    const counts = await this.db.ticket.groupBy({
      by: ['eventId'],
      where: { OR: [{ status: 'PAID' }, { status: 'RESERVED', reservedUntil: { gt: new Date() } }] },
      _count: { _all: true },
    });
    const taken = new Map(counts.map((c) => [c.eventId, c._count._all]));
    return list.map((e) => ({ ...e, freeSeats: e.capacity - (taken.get(e.id) ?? 0) }));
  }

  @Roles('ADMIN')
  @Patch('admin/events/:id')
  @ApiOperation({ summary: 'Изменить событие или опубликовать черновик', description: 'Роль: ADMIN.' })
  @ApiErrors({
    400: 'Дата в прошлом или партнёр не найден',
    404: 'Событие не найдено',
    409: 'Вместимость меньше числа занятых мест',
  })
  async updateEvent(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ event_id: string }[]>`SELECT event_id FROM events WHERE event_id=${id} FOR UPDATE`;
      if (!rows.length) throw new NotFoundException('Событие не найдено');
      if (dto.startsAt && new Date(dto.startsAt) <= new Date()) throw new BadRequestException('Выберите будущую дату');
      if (dto.partnerId && !(await tx.partner.findUnique({ where: { id: dto.partnerId } }))) {
        throw new BadRequestException('Партнёр не найден');
      }
      const taken = await tx.ticket.count({ where: takenSeats(id) });
      if (dto.capacity !== undefined && dto.capacity < taken) {
        throw new ConflictException('Вместимость меньше числа занятых мест');
      }
      return tx.event.update({
        where: { id },
        data: { ...dto, ...(dto.startsAt ? { startsAt: new Date(dto.startsAt) } : {}) },
      });
    });
  }

  @Delete('events/:id/tickets')
  @ApiOperation({ summary: '42: отменить неоплаченную бронь' })
  @ApiErrors({ 404: 'Бронь не найдена', 409: 'Оплаченный билет требует возврата через организатора' })
  async cancelReservation(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) eventId: string) {
    const t = await this.db.ticket.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } });
    if (!t) throw new NotFoundException('Бронь не найдена');
    if (t.status === 'PAID') throw new ConflictException('Оплаченный билет требует возврата через организатора');
    const changed = await this.db.ticket.updateMany({
      where: { eventId, userId: user.id, status: 'RESERVED' },
      data: { status: 'RELEASED', reservedUntil: new Date(), paymentId: null },
    });
    return { released: !!changed.count };
  }

  @Get('tickets/:id/pass')
  @ApiOperation({ summary: '43: QR-код оплаченного билета', description: ':id — идентификатор события.' })
  @ApiErrors({ 404: 'Билет не найден', 409: 'Билет ещё не оплачен' })
  async pass(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) eventId: string) {
    const ticket = await this.db.ticket.findUnique({ where: { eventId_userId: { eventId, userId: user.id } } });
    if (!ticket) throw new NotFoundException('Билет не найден');
    if (ticket.status !== 'PAID') throw new ConflictException('Билет ещё не оплачен');
    return {
      token: ticket.passToken,
      checkedInAt: ticket.checkedInAt,
      qrDataUrl: await QRCode.toDataURL(ticket.passToken, { width: 256, margin: 2 }),
    };
  }

  @Roles('ADMIN')
  @Post('admin/tickets/check-in')
  @HttpCode(200)
  @ApiOperation({ summary: 'Отметить вход по QR', description: 'Однократно. Роль: ADMIN.' })
  @ApiErrors({ 409: 'Билет недействителен или уже использован' })
  async checkIn(@Body() body: CheckInDto) {
    const result = await this.db.ticket.updateMany({
      where: { passToken: body.token, status: 'PAID', checkedInAt: null },
      data: { checkedInAt: new Date() },
    });
    if (!result.count) throw new ConflictException('Билет недействителен или уже использован');
    return { checkedIn: true };
  }

  // ── Платежи ──────────────────────────────────────────────────────────

  @Get('payments')
  @ApiOperation({ summary: 'История моих платежей', description: 'Последние 100.' })
  history(@CurrentUser() user: AuthUser) {
    return this.db.payment.findMany({
      where: { userId: user.id },
      select: { id: true, kind: true, amount: true, status: true, createdAt: true, paidAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  @Get('payments/:id')
  @ApiOperation({
    summary: 'Статус моего платежа',
    description: 'requiresRefund: деньги получены, но билет выдать нельзя (бронь истекла) — нужна сверка/возврат.',
  })
  @ApiErrors({ 404: 'Платёж не найден' })
  async payment(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    const p = await this.db.payment.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true, kind: true, amount: true, status: true, confirmationUrl: true, idempotencyKey: true,
        ticket: { select: { status: true, eventId: true } },
      },
    });
    if (!p) throw new NotFoundException('Платёж не найден');
    return {
      ...p,
      confirmationUrl: p.status === 'PENDING' ? p.confirmationUrl : null,
      requiresRefund: p.kind === 'TICKET' && p.status === 'SUCCEEDED' && p.ticket?.status !== 'PAID',
    };
  }

  @Get('subscription')
  @ApiOperation({ summary: '51: мой Premium', description: 'Активность, срок и текущая цена в копейках.' })
  async subscription(@CurrentUser() user: AuthUser) {
    const sub = await this.db.subscription.findFirst({
      where: { payment: { userId: user.id }, endsAt: { gt: new Date() } },
      orderBy: { endsAt: 'desc' },
      select: { endsAt: true },
    });
    return {
      active: !!sub,
      endsAt: sub?.endsAt ?? null,
      priceKopecks: Number(process.env.PREMIUM_PRICE_KOPECKS || 34900),
    };
  }

  private sandboxEnabled() {
    if (process.env.NODE_ENV === 'production' || process.env.PAYMENT_PROVIDER !== 'fake') throw new NotFoundException();
  }

  @Post('payments/:id/simulate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Тестовая оплата: подтвердить или отклонить', description: 'Только PAYMENT_PROVIDER=fake, не в production.' })
  @ApiErrors({ 404: 'Платёж не найден или песочница выключена' })
  async simulate(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SandboxDto) {
    this.sandboxEnabled();
    const p = await this.db.payment.findFirst({ where: { id, userId: user.id } });
    if (!p) throw new NotFoundException('Платёж не найден');
    await this.payments.handleWebhook(
      { 'x-webhook-secret': process.env.PAYMENT_WEBHOOK_SECRET },
      { providerPaymentId: p.providerPaymentId, status: dto.status },
    );
    return this.payment(user, id);
  }

  @Public()
  @Get('payments/:id/sandbox')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Страница тестовой оплаты', description: 'HTML. Только PAYMENT_PROVIDER=fake, не в production.' })
  sandbox(@Param('id', ParseUUIDPipe) id: string) {
    this.sandboxEnabled();
    return SANDBOX_HTML.replace('__PAYMENT_ID__', id);
  }

  // ── Модерация и отчёты ───────────────────────────────────────────────

  @Roles('MODERATOR', 'ADMIN')
  @Get('admin/reports/:id')
  @ApiOperation({ summary: '32: жалоба с контекстом', description: 'До 20 последних сообщений переписки. Роли: MODERATOR, ADMIN.' })
  @ApiErrors({ 404: 'Жалоба не найдена' })
  async report(@Param('id', ParseUUIDPipe) id: string) {
    const r = await this.db.report.findUnique({
      where: { id },
      include: { target: { select: { id: true, status: true, profile: { select: { name: true } } } } },
    });
    if (!r) throw new NotFoundException('Жалоба не найдена');
    const match = await this.db.match.findFirst({
      where: { OR: [{ userAId: r.authorId, userBId: r.targetId }, { userAId: r.targetId, userBId: r.authorId }] },
    });
    const messages = match
      ? await this.db.message.findMany({ where: { matchId: match.id }, orderBy: { sentAt: 'desc' }, take: 20 })
      : [];
    return { ...r, messages };
  }

  @Roles('ADMIN')
  @Get('admin/stats/daily')
  @ApiOperation({ summary: '53: регистрации по дням', description: 'Дни по времени Екатеринбурга, период до 366 дней. Роль: ADMIN.' })
  @ApiOkResponse({ schema: { type: 'array', items: { type: 'object', properties: { day: { type: 'string' }, registrations: { type: 'number' } } } } })
  @ApiErrors({ 400: 'Выберите период от 1 до 366 дней' })
  async daily(@Query() q: StatsQueryDto) {
    const from = new Date(q.from);
    const to = new Date(q.to);
    if (to <= from || to.getTime() - from.getTime() > 366 * 86_400_000) {
      throw new BadRequestException('Выберите период от 1 до 366 дней');
    }
    const rows = await this.db.$queryRaw<{ day: string; registrations: bigint }[]>`
      SELECT to_char(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Yekaterinburg', 'YYYY-MM-DD') AS day,
             count(*) AS registrations
      FROM users WHERE created_at >= ${from} AND created_at < ${to}
      GROUP BY day ORDER BY day`;
    return rows.map((r) => ({ ...r, registrations: Number(r.registrations) }));
  }
}

const SANDBOX_HTML = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>CAMPUS · тестовая оплата</title>
<style>body{max-width:420px;margin:60px auto;padding:24px;background:#f4dcbc;color:#261812;font:17px Arial}h1{color:#ed0038}
button{padding:16px;border:0;border-radius:28px;background:#ed0038;color:white;margin:10px 0;width:100%;font:inherit}</style>
<h1>Тестовая оплата</h1><p>Локальная песочница. Деньги не списываются, данные карты не нужны.</p>
<button data-status="succeeded">Подтвердить тестовую оплату</button><button data-status="canceled">Имитировать отказ</button>
<p id="result"></p><a href="/#payment-pending">Вернуться в CAMPUS</a>
<script>document.addEventListener('click',async e=>{const status=e.target.dataset.status;if(!status)return;
document.querySelectorAll('button').forEach(b=>b.disabled=true);
try{const r=await fetch('/api/payments/__PAYMENT_ID__/simulate',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sessionStorage.getItem('campus-token')},body:JSON.stringify({status})});
const d=await r.json();document.getElementById('result').textContent=r.ok?'Готово. Вернись в CAMPUS, чтобы посмотреть результат.':d.message;}
catch{document.getElementById('result').textContent='Нет соединения с сервером';}
finally{document.querySelectorAll('button').forEach(b=>b.disabled=false);}});</script></html>`;
