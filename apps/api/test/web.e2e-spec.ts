import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { setupApp } from '../src/setup-app';

describe('Web integration · реальные PostgreSQL/Redis',()=>{
 let app:INestApplication,db:PrismaService,eventId:string,matchId:string,photoId:string,photoKey:string,paymentId:string,token:string;
 const codes=new Map<string,string>(),ids:Record<string,string>={},tokens:Record<string,string>={};
 const api=()=>request(app.getHttpServer());
 const auth=(who:string)=>({Authorization:`Bearer ${tokens[who]}`});
 const body=(who:string)=>({name:who,university:'УрФУ',institute:who,goal:'DATING',interests:['кино','походы','игры']});
 beforeAll(async()=>{
  const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(MailService).useValue({sendCode:async(email:string,code:string)=>codes.set(email,code)}).compile();
  app=module.createNestApplication({logger:false});setupApp(app);await app.init();db=app.get(PrismaService);
  const stamp=Date.now();
  for(const who of ['admin','alice','bob','outsider']){
   const email=`web-${who}-${stamp}@urfu.me`;
   await api().post('/auth/email/request').send({email}).expect(202);
   const verified=await api().post('/auth/email/verify').send({email,code:codes.get(email),birthDate:'2004-05-10',acceptTerms:true}).expect(200);
   tokens[who]=verified.body.accessToken;ids[who]=(await api().get('/profile').set(auth(who)).expect(200)).body.id;
   await api().put('/profile').set(auth(who)).send(body(who)).expect(200);
   await api().post('/profile/photos').set(auth(who)).send({storageKey:`test/${who}.jpg`}).expect(201);
  }
  await db.user.update({where:{id:ids.admin},data:{role:'ADMIN'}});
 });
 afterAll(async()=>{if(app)await app.close();});
 it('различные интересы, фильтры, возраст без раскрытия даты рождения',async()=>{
  await api().put('/profile').set(auth('alice')).send({...body('alice'),interests:['кино','Кино',' кино ']}).expect(400);
  await api().get('/feed').set(auth('alice')).query({minAge:30,maxAge:18}).expect(400);
  const result=await api().get('/feed').set(auth('alice')).query({university:'УрФУ',goal:'DATING',minAge:18,maxAge:25}).expect(200);
  expect(result.body.some((p:{userId:string})=>p.userId===ids.bob)).toBe(true);
  expect(result.body[0].age).toBeGreaterThanOrEqual(18);expect(result.body[0].birthDate).toBeUndefined();
 });
 it('файл загружается, читается, сортируется; чужие фото и поддельные изображения отклоняются',async()=>{
  await api().post('/profile/photos/upload').set(auth('alice')).attach('file',Buffer.from('not-image'),'fake.jpg').expect(400);
  const bytes=readFileSync(resolve(__dirname,'../../../mob-front/assets/anya.jpg'));
  const photo=await api().post('/profile/photos/upload').set(auth('alice')).attach('file',bytes,'anya.jpg').expect(201);
  photoId=photo.body.id;photoKey=photo.body.storageKey;
  const image=await api().get(photoKey.replace('/api','')).expect(200);expect(image.body.equals(bytes)).toBe(true);
  const photos=(await api().get('/profile').set(auth('alice')).expect(200)).body.profile.photos;
  const order=photos.map((p:{id:string})=>p.id).reverse();
  expect((await api().patch('/profile/photos/order').set(auth('alice')).send({ids:order}).expect(200)).body[0].id).toBe(photoId);
  await api().patch('/profile/photos/order').set(auth('bob')).send({ids:order}).expect(400);
  await api().delete(`/profile/photos/${photoId}`).set(auth('bob')).expect(404);
  for(const storageKey of ['https://tracker.example/p.gif','//tracker.example/p.gif','../secret.jpg','javascript:alert(1)'])
    await api().post('/profile/photos').set(auth('alice')).send({storageKey}).expect(400);
  const concurrent=await Promise.all(Array.from({length:8},(_,i)=>api().post('/profile/photos').set(auth('alice')).send({storageKey:`test/${i}.jpg`})));
  expect(concurrent.filter(r=>r.status===201)).toHaveLength(4);expect(await db.photo.count({where:{userId:ids.alice}})).toBe(6);
 });
 it('прямой лайк не обходит видимость; настройки и исходящие симпатии сохраняются',async()=>{
  await api().put('/profile').set(auth('bob')).send({...body('bob'),isVisible:false,notifications:false,theme:'dark'}).expect(200);
  await api().post('/likes').set(auth('alice')).send({toUserId:ids.bob,isLike:true}).expect(404);
  const profile=(await api().get('/profile').set(auth('bob')).expect(200)).body.profile;
  expect(profile.theme).toBe('dark');expect(profile.notifications).toBe(false);
  await api().put('/profile').set(auth('bob')).send({...body('bob'),isVisible:true}).expect(200);
  await api().post('/likes').set(auth('alice')).send({toUserId:ids.bob,isLike:true}).expect(201);
  matchId=(await api().post('/likes').set(auth('bob')).send({toUserId:ids.alice,isLike:true}).expect(201)).body.matchId;
  const outgoing=await api().get('/likes/outgoing').set(auth('alice')).expect(200);expect(outgoing.body.some((p:{userId:string})=>p.userId===ids.bob)).toBe(true);
 });
 it('встречи из базы доступны участникам; параллельные ответы атомарны',async()=>{
  const meeting=(await api().post(`/matches/${matchId}/meetings`).set(auth('alice')).send({place:'Кофейня у корпуса',meetAt:new Date(Date.now()+86400000).toISOString()}).expect(201)).body;
  expect((await api().get(`/matches/${matchId}/meetings`).set(auth('bob')).expect(200)).body[0].id).toBe(meeting.id);
  await api().get(`/matches/${matchId}/meetings`).set(auth('outsider')).expect(403);
  const answers=await Promise.all(['ACCEPTED','DECLINED'].map(status=>api().patch(`/meetings/${meeting.id}`).set(auth('bob')).send({status})));
  expect(answers.map(r=>r.status).sort()).toEqual([200,409]);
 });
 it('clientId не переиспользуется собеседником; блокировка закрывает чат обоим',async()=>{
  await api().post(`/matches/${matchId}/messages`).set(auth('alice')).send({clientId:'collision',text:'Сообщение Алисы'}).expect(201);
  await api().post(`/matches/${matchId}/messages`).set(auth('bob')).send({clientId:'collision',text:'Сообщение Боба'}).expect(409);
  await api().post(`/users/${ids.bob}/block`).set(auth('alice')).expect(200);
  await api().get(`/matches/${matchId}/messages`).set(auth('bob')).expect(403);
  expect((await api().get('/blocks').set(auth('alice')).expect(200)).body).toHaveLength(1);
  expect((await api().get('/matches').set(auth('bob')).expect(200)).body).toEqual([]);
  await api().delete(`/users/${ids.bob}/block`).set(auth('alice')).expect(200);
  await api().get(`/matches/${matchId}/messages`).set(auth('bob')).expect(200);
 });
 it('событие редактируется, черновик скрыт, права администратора проверяются',async()=>{
  const partner=(await api().post('/admin/partners').set(auth('admin')).send({name:'Тестовый партнёр',address:'Екатеринбург, ул. Мира, 19'}).expect(201)).body;
  expect((await api().get('/admin/partners').set(auth('admin')).expect(200)).body.length).toBeGreaterThan(0);
  await api().get('/admin/partners').set(auth('alice')).expect(403);
  eventId=(await api().post('/admin/events').set(auth('admin')).send({partnerId:partner.id,title:'Тестовый концерт',startsAt:new Date(Date.now()+7*86400000).toISOString(),price:45000,capacity:3,category:'Концерты',description:'Проверка API',posterUrl:'/assets/concert.jpg',published:false}).expect(201)).body.id;
  await api().get(`/events/${eventId}`).set(auth('alice')).expect(404);
  await api().post(`/events/${eventId}/tickets`).set(auth('alice')).expect(404);
  await api().patch(`/admin/events/${eventId}`).set(auth('admin')).send({published:true,title:'Обновлённый концерт'}).expect(200);
  const detail=(await api().get(`/events/${eventId}`).set(auth('alice')).expect(200)).body;expect(detail.category).toBe('Концерты');expect(detail.freeSeats).toBe(3);
 });
 it('параллельные платежи не создают дубли; чужой статус и QR недоступны',async()=>{
  await api().post(`/events/${eventId}/tickets`).set(auth('alice')).expect(201);
  const payments=await Promise.all(['race-one','race-two'].map(key=>api().post('/payments').set(auth('alice')).set('Idempotency-Key',key).send({kind:'TICKET',eventId})));
  expect(payments.map(p=>p.status)).toEqual([201,201]);expect(payments[0].body.id).toBe(payments[1].body.id);paymentId=payments[0].body.id;
  await api().get(`/payments/${paymentId}`).set(auth('bob')).expect(404);
  expect((await api().get(`/payments/${paymentId}`).set(auth('alice')).expect(200)).body.status).toBe('PENDING');
  await api().post('/payments').set(auth('alice')).set('Idempotency-Key',payments[0].body.idempotencyKey).send({kind:'PREMIUM'}).expect(409);
  expect((await api().get('/payments').set(auth('alice')).expect(200)).body).toHaveLength(1);
  await api().get(`/tickets/${eventId}/pass`).set(auth('alice')).expect(409);
 });
 it('песочница подтверждает оплату; QR пропускает ровно один раз, только администратора',async()=>{
  await api().post(`/payments/${paymentId}/simulate`).set(auth('bob')).send({status:'succeeded'}).expect(404);
  await api().post(`/payments/${paymentId}/simulate`).set(auth('alice')).send({status:'succeeded'}).expect(200);
  const pass=(await api().get(`/tickets/${eventId}/pass`).set(auth('alice')).expect(200)).body;
  expect(pass.qrDataUrl).toMatch(/^data:image\/png;base64,/);token=pass.token;
  await api().get(`/tickets/${eventId}/pass`).set(auth('bob')).expect(404);
  await api().post('/admin/tickets/check-in').set(auth('alice')).send({token}).expect(403);
  await api().post('/admin/tickets/check-in').set(auth('admin')).send({token}).expect(200);
  await api().post('/admin/tickets/check-in').set(auth('admin')).send({token}).expect(409);
  const before=process.env.NODE_ENV;process.env.NODE_ENV='production';try{await api().get(`/payments/${paymentId}/sandbox`).expect(404);}finally{process.env.NODE_ENV=before;}
 });
 it('отмена неоплаченной брони освобождает место; вместимость не меньше занятых мест',async()=>{
  await api().post(`/events/${eventId}/tickets`).set(auth('bob')).expect(201);
  await api().patch(`/admin/events/${eventId}`).set(auth('admin')).send({capacity:1}).expect(409);
  await api().delete(`/events/${eventId}/tickets`).set(auth('bob')).expect(200);
  expect((await api().get(`/events/${eventId}`).set(auth('bob')).expect(200)).body.freeSeats).toBe(2);
  await api().delete(`/events/${eventId}/tickets`).set(auth('alice')).expect(409);
 });
 it('Premium из API, статистика по дням, неверный диапазон дат и доступ к жалобам',async()=>{
  const from=new Date(Date.now()-86400000).toISOString(),to=new Date(Date.now()+86400000).toISOString();
  expect((await api().get('/subscription').set(auth('alice')).expect(200)).body.active).toBe(false);
  await api().get('/admin/stats/daily').set(auth('alice')).query({from,to}).expect(403);
  expect((await api().get('/admin/stats/daily').set(auth('admin')).query({from,to}).expect(200)).body[0].registrations).toBeGreaterThan(0);
  await api().get('/admin/stats').set(auth('admin')).query({from:to,to:from}).expect(400);
  const report=(await api().post('/reports').set(auth('alice')).send({targetId:ids.bob,reason:'Тестовая жалоба'}).expect(201)).body;
  await api().get(`/admin/reports/${report.id}`).set(auth('bob')).expect(403);
  const detail=(await api().get(`/admin/reports/${report.id}`).set(auth('admin')).expect(200)).body;expect(detail.messages).toHaveLength(1);
  await api().post(`/admin/reports/${report.id}/decision`).set(auth('admin')).send({decision:'REJECTED'}).expect(200);
  expect((await api().get('/admin/reports').set(auth('admin')).query({status:'CLOSED'}).expect(200)).body.length).toBeGreaterThan(0);
 });
 it('удаление своего загруженного фото удаляет файл',async()=>{
  await api().delete(`/profile/photos/${photoId}`).set(auth('alice')).expect(204);
  await api().get(photoKey.replace('/api','')).expect(404);
 });
 it('два параллельных лайка не превышают суточный лимит 30',async()=>{
  const stamp=Date.now();
  for(let i=0;i<29;i++){const u=await db.user.create({data:{universityEmail:`limit-${stamp}-${i}@urfu.me`,birthDate:new Date('2000-01-01')}});await db.like.create({data:{fromUserId:ids.outsider,toUserId:u.id,isLike:true}});}
  const results=await Promise.all([ids.alice,ids.bob].map(toUserId=>api().post('/likes').set(auth('outsider')).send({toUserId,isLike:true})));
  expect(results.map(r=>r.status).sort()).toEqual([201,429]);
  expect(await db.like.count({where:{fromUserId:ids.outsider,isLike:true}})).toBe(30);
 });
 it('поздняя оплата отменённой брони не выдаёт второе последнее место',async()=>{
  const partner=await db.partner.findFirstOrThrow();
  const event=await db.event.create({data:{title:'Последнее место · регрессия',partnerId:partner.id,capacity:1,price:10000,startsAt:new Date(Date.now()+86400000)}});
  await api().post(`/events/${event.id}/tickets`).set(auth('alice')).expect(201);
  const payment=(await api().post('/payments').set(auth('alice')).send({kind:'TICKET',eventId:event.id}).expect(201)).body;
  await api().delete(`/events/${event.id}/tickets`).set(auth('alice')).expect(200);
  await api().post(`/events/${event.id}/tickets`).set(auth('bob')).expect(201);
  const paid=await api().post(`/payments/${payment.id}/simulate`).set(auth('alice')).send({status:'succeeded'}).expect(200);
  expect(paid.body.requiresRefund).toBe(true);
  expect(await db.ticket.count({where:{eventId:event.id,status:'PAID'}})).toBe(0);
  expect((await api().get(`/events/${event.id}`).set(auth('bob')).expect(200)).body.freeSeats).toBe(0);
 });
});
