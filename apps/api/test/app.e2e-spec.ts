/**
 * Сквозной тест сценариев С1–С6 из модели ИС на реальных PostgreSQL и Redis.
 * Запуск: pnpm test:e2e (нужны запущенные Postgres и Redis, база campus_test с применёнными миграциями).
 */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import Redis from 'ioredis';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';
import { REDIS } from '../src/common/redis.module';
import { MailService } from '../src/mail/mail.service';
import { PaymentsService } from '../src/payments/payments.service';
import { setupApp } from '../src/setup-app';

const codes = new Map<string, string>();
const WEBHOOK = { 'x-webhook-secret': 'webhook-test-secret' };

describe('CAMPUS API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const t: Record<string, string> = {};
  const id: Record<string, string> = {};

  const api = () => request(app.getHttpServer());
  const auth = (who: string) => ({ Authorization: `Bearer ${t[who]}` });

  async function login(who: string, birthDate = '2004-05-10') {
    const email = `${who}@urfu.me`;
    await api().post('/auth/email/request').send({ email }).expect(202);
    const res = await api().post('/auth/email/verify')
      .send({ email, code: codes.get(email), birthDate, acceptTerms: true }).expect(200);
    t[who] = res.body.accessToken;
    id[who] = (await prisma.user.findUniqueOrThrow({ where: { universityEmail: email } })).id;
  }

  async function fillProfile(who: string, institute: string, hideFromInstitute = false) {
    await api().put('/profile').set(auth(who)).send({
      name: who, university: 'УрФУ', institute, goal: 'DATING',
      interests: ['настолки', 'кино', 'походы', who], hideFromInstitute,
    }).expect(200);
    await api().post('/profile/photos').set(auth(who)).send({ storageKey: `photos/${who}.jpg` }).expect(201);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendCode: async (email: string, code: string) => void codes.set(email, code) })
      .compile();
    app = moduleRef.createNestApplication({ logger: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await app.get<Redis>(REDIS).flushdb();
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((x) => `"${x.tablename}"`).join(', ')} CASCADE`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('С1 · регистрация и подтверждение (A1)', () => {
    it('принимает только почту вуза', async () => {
      await api().post('/auth/email/request').send({ email: 'ivan@gmail.com' }).expect(400);
    });

    it('не регистрирует младше 18 лет', async () => {
      await api().post('/auth/email/request').send({ email: 'kid@urfu.me' }).expect(202);
      await api().post('/auth/email/verify')
        .send({ email: 'kid@urfu.me', code: codes.get('kid@urfu.me'), birthDate: '2015-01-01', acceptTerms: true })
        .expect(400);
    });

    it('после 3 неверных кодов блокирует попытки', async () => {
      await api().post('/auth/email/request').send({ email: 'guess@urfu.me' }).expect(202);
      const wrong = codes.get('guess@urfu.me') === '000000' ? '111111' : '000000';
      const body = { email: 'guess@urfu.me', code: wrong, birthDate: '2004-01-01', acceptTerms: true };
      const r1 = await api().post('/auth/email/verify').send(body).expect(422);
      expect(r1.body.attemptsLeft).toBe(2);
      await api().post('/auth/email/verify').send(body).expect(422);
      await api().post('/auth/email/verify').send(body).expect(429);
      await api().post('/auth/email/request').send({ email: 'guess@urfu.me' }).expect(429);
    });

    it('не отправляет код чаще раза в минуту', async () => {
      await api().post('/auth/email/request').send({ email: 'spam@urfu.me' }).expect(202);
      const first = codes.get('spam@urfu.me');
      await api().post('/auth/email/request').send({ email: 'spam@urfu.me' }).expect(429);
      expect(codes.get('spam@urfu.me')).toBe(first);
    });

    it('без согласия на обработку данных не регистрирует, код одноразовый', async () => {
      const email = 'consent@urfu.me';
      await api().post('/auth/email/request').send({ email }).expect(202);
      const body = { email, code: codes.get(email), birthDate: '2003-03-03' };
      await api().post('/auth/email/verify').send(body).expect(400);
      // тот же код подходит после исправления запроса…
      await api().post('/auth/email/verify').send({ ...body, acceptTerms: true }).expect(200);
      // …но второй раз уже не работает
      await api().post('/auth/email/verify').send({ ...body, acceptTerms: true }).expect(400);
      const u = await prisma.user.findUniqueOrThrow({ where: { universityEmail: email } });
      expect(u.consentAt).toBeInstanceOf(Date);
    });

    it('ограничивает частоту запросов кода с одного адреса', async () => {
      process.env.THROTTLE_DISABLED = '0';
      try {
        const statuses: number[] = [];
        for (let i = 0; i < 7; i++) {
          statuses.push((await api().post('/auth/email/request').send({ email: `x${i}@gmail.com` })).status);
        }
        expect(statuses.slice(0, 5)).toEqual([400, 400, 400, 400, 400]);
        expect(statuses[6]).toBe(429);
      } finally {
        process.env.THROTTLE_DISABLED = '1';
      }
    });

    it('удаляет аккаунт вместе с данными', async () => {
      await login('temp');
      await fillProfile('temp', 'ИнЭУ');
      await api().delete('/profile').set(auth('temp')).expect(204);
      expect(await prisma.user.count({ where: { id: id.temp } })).toBe(0);
      expect(await prisma.photo.count({ where: { userId: id.temp } })).toBe(0);
      await api().get('/profile').set(auth('temp')).expect(401);
    });

    it('регистрирует студентов: is_verified хранится у пользователя', async () => {
      for (const who of ['anna', 'boris', 'clara', 'dima', 'egor']) await login(who);
      const me = await api().get('/profile').set(auth('anna')).expect(200);
      expect(me.body.isVerified).toBe(true);
      expect(me.body.profile).toBeNull();
      await api().get('/profile').expect(401);
    });

    it('проверяет анкету: нужно 3 интереса', async () => {
      await api().put('/profile').set(auth('anna'))
        .send({ name: 'a', university: 'УрФУ', institute: 'ИРИТ-РтФ', goal: 'DATING', interests: ['кино'] })
        .expect(400);
      await fillProfile('anna', 'ИРИТ-РтФ');
      await fillProfile('boris', 'ИЕНиМ');
      await fillProfile('clara', 'ИРИТ-РтФ', true);
      await fillProfile('egor', 'УГИ');
    });
  });

  describe('С2 · знакомство (A2)', () => {
    it('лента: без своего института при «скрыть», без пустых анкет', async () => {
      const feed = await api().get('/feed').set(auth('anna')).expect(200);
      const names = feed.body.map((x: { name: string }) => x.name);
      expect(names).toEqual(expect.arrayContaining(['boris', 'egor']));
      expect(names).not.toContain('clara'); // скрыла анкету от своего института
      expect(names).not.toContain('dima'); // анкета не заполнена
      expect(feed.body[0].photos.length).toBe(1);
    });

    it('лайкать можно только с анкетой и только тех, кто виден в ленте', async () => {
      await api().post('/likes').set(auth('dima')).send({ toUserId: id.anna, isLike: true }).expect(409);
      await api().post('/likes').set(auth('anna')).send({ toUserId: id.dima, isLike: true }).expect(404);
    });

    it('взаимный лайк создаёт совпадение', async () => {
      const r1 = await api().post('/likes').set(auth('anna')).send({ toUserId: id.boris, isLike: true }).expect(201);
      expect(r1.body.match).toBe(false);
      const r2 = await api().post('/likes').set(auth('boris')).send({ toUserId: id.anna, isLike: true }).expect(201);
      expect(r2.body.match).toBe(true);
      id.match = r2.body.matchId;
      await api().post('/likes').set(auth('anna')).send({ toUserId: id.boris, isLike: true }).expect(409);
      const feed = await api().get('/feed').set(auth('anna')).expect(200);
      expect(feed.body.map((x: { name: string }) => x.name)).not.toContain('boris');
    });

    it('переписка: повтор с тем же clientId не создаёт дубль, чужой не видит', async () => {
      const m1 = await api().post(`/matches/${id.match}/messages`).set(auth('anna'))
        .send({ clientId: 'c1', text: 'Привет!' }).expect(201);
      const m2 = await api().post(`/matches/${id.match}/messages`).set(auth('anna'))
        .send({ clientId: 'c1', text: 'Привет!' }).expect(201);
      expect(m2.body.id).toBe(m1.body.id);
      const list = await api().get(`/matches/${id.match}/messages`).set(auth('boris')).expect(200);
      expect(list.body).toHaveLength(1);
      await api().get(`/matches/${id.match}/messages`).set(auth('egor')).expect(403);
    });

    it('встречу принимает только второй участник', async () => {
      const meetAt = new Date(Date.now() + 3 * 24 * 3600_000).toISOString();
      const m = await api().post(`/matches/${id.match}/meetings`).set(auth('anna'))
        .send({ place: 'Антикафе на Ленина', meetAt }).expect(201);
      await api().patch(`/meetings/${m.body.id}`).set(auth('anna')).send({ status: 'ACCEPTED' }).expect(403);
      const ok = await api().patch(`/meetings/${m.body.id}`).set(auth('boris')).send({ status: 'ACCEPTED' }).expect(200);
      expect(ok.body.status).toBe('ACCEPTED');
    });

    it('лимит 30 лайков в сутки без Premium', async () => {
      await prisma.user.createMany({
        data: Array.from({ length: 30 }, (_, i) => ({ universityEmail: `bot${i}@urfu.me`, birthDate: new Date('2000-01-01') })),
      });
      const bots = await prisma.user.findMany({ where: { universityEmail: { startsWith: 'bot' } } });
      await prisma.like.createMany({ data: bots.map((b) => ({ fromUserId: id.egor, toUserId: b.id, isLike: true })) });
      const r = await api().post('/likes').set(auth('egor')).send({ toUserId: id.anna, isLike: true }).expect(429);
      expect(r.body.code).toBe('LIKE_LIMIT');
      await api().post('/likes').set(auth('egor')).send({ toUserId: id.anna, isLike: false }).expect(201);
    });
  });

  describe('С6 · Premium снимает лимит (A5 → A2)', () => {
    it('оплата Premium и повторное уведомление', async () => {
      const p = await api().post('/payments').set(auth('egor')).send({ kind: 'PREMIUM' }).expect(201);
      expect(p.body.amount).toBe(34900);
      const providerPaymentId = `fake_${p.body.id}`;
      await api().post('/payments/webhook').set({ 'x-webhook-secret': 'wrong-secret-of-same-size' })
        .send({ providerPaymentId, status: 'succeeded' }).expect(401);
      const w1 = await api().post('/payments/webhook').set(WEBHOOK).send({ providerPaymentId, status: 'succeeded' }).expect(200);
      expect(w1.body.duplicate).toBe(false);
      const w2 = await api().post('/payments/webhook').set(WEBHOOK).send({ providerPaymentId, status: 'succeeded' }).expect(200);
      expect(w2.body.duplicate).toBe(true);
      expect(await prisma.subscription.count()).toBe(1);
      await api().post('/likes').set(auth('egor')).send({ toUserId: id.boris, isLike: true }).expect(201);
    });
  });

  describe('С3 · жалобы и модерация (A3)', () => {
    it('3 жалобы скрывают анкету, решение модератора возвращает её', async () => {
      for (const who of ['clara', 'dima', 'egor']) {
        await api().post('/reports').set(auth(who)).send({ targetId: id.boris, reason: 'Спам в переписке' }).expect(201);
      }
      await api().post('/reports').set(auth('egor')).send({ targetId: id.boris, reason: 'Ещё раз' }).expect(409);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: id.boris } })).status).toBe('HIDDEN');

      await api().get('/admin/reports').set(auth('anna')).expect(403);
      await prisma.user.update({ where: { id: id.anna }, data: { role: 'MODERATOR' } });
      const queue = await api().get('/admin/reports').set(auth('anna')).expect(200);
      expect(queue.body).toHaveLength(3);
      const d = await api().post(`/admin/reports/${queue.body[0].id}/decision`).set(auth('anna'))
        .send({ decision: 'REJECTED' }).expect(201);
      expect(d.body.status).toBe('ACTIVE');
      expect(await prisma.report.count({ where: { status: 'OPEN' } })).toBe(0);
    });

    it('блокировка действует сразу', async () => {
      const r = await api().post('/reports').set(auth('egor')).send({ targetId: id.dima, reason: 'Оскорбления' }).expect(201);
      await api().post(`/admin/reports/${r.body.id}/decision`).set(auth('anna')).send({ decision: 'BLOCKED' }).expect(201);
      await api().get('/profile').set(auth('dima')).expect(403);
      await api().post('/auth/email/request').send({ email: 'dima@urfu.me' }).expect(403);
    });

    it('отклонение новой жалобы не разблокирует заблокированного', async () => {
      const r = await api().post('/reports').set(auth('clara')).send({ targetId: id.dima, reason: 'Ещё жалоба' }).expect(201);
      const d = await api().post(`/admin/reports/${r.body.id}/decision`).set(auth('anna'))
        .send({ decision: 'REJECTED' }).expect(201);
      expect(d.body.status).toBe('BLOCKED');
      await api().get('/profile').set(auth('dima')).expect(403);
    });
  });

  describe('С4–С5 · мероприятие и оплата билета (A4 → A5 → A4)', () => {
    it('публикация и бронь последнего места', async () => {
      await prisma.user.update({ where: { id: id.anna }, data: { role: 'ADMIN' } });
      await api().post('/admin/partners').set(auth('boris')).send({ name: 'X', address: 'Y' }).expect(403);
      const partner = await api().post('/admin/partners').set(auth('anna'))
        .send({ name: 'Антикафе', address: 'Екатеринбург, Ленина 1' }).expect(201);
      const startsAt = new Date(Date.now() + 7 * 24 * 3600_000).toISOString();
      const ev = await api().post('/admin/events').set(auth('anna'))
        .send({ partnerId: partner.body.id, title: 'Вечер настолок', startsAt, capacity: 1, price: 40000 }).expect(201);
      id.event = ev.body.id;

      await api().post(`/events/${id.event}/tickets`).set(auth('boris')).expect(201);
      await api().post(`/events/${id.event}/tickets`).set(auth('clara')).expect(409);
      const afisha = await api().get('/events').set(auth('clara')).expect(200);
      expect(afisha.body[0].freeSeats).toBe(0);
    });

    it('платёж идемпотентен, билет подтверждается только уведомлением', async () => {
      const key = 'ticket-boris-1';
      const p1 = await api().post('/payments').set(auth('boris')).set('Idempotency-Key', key)
        .send({ kind: 'TICKET', eventId: id.event }).expect(201);
      const p2 = await api().post('/payments').set(auth('boris')).set('Idempotency-Key', key)
        .send({ kind: 'TICKET', eventId: id.event }).expect(201);
      expect(p2.body.id).toBe(p1.body.id);
      expect(p1.body.amount).toBe(40000);
      expect(p1.body.confirmationUrl).toContain(p1.body.id);
      expect(p2.body.confirmationUrl).toBe(p1.body.confirmationUrl);

      // платёжный сервис «упал» при создании: следующий запрос получает ссылку заново, второй платёж не создаётся
      await prisma.payment.update({ where: { id: p1.body.id }, data: { providerPaymentId: null, confirmationUrl: null } });
      const p3 = await api().post('/payments').set(auth('boris')).send({ kind: 'TICKET', eventId: id.event }).expect(201);
      expect(p3.body.id).toBe(p1.body.id);
      expect(p3.body.confirmationUrl).toBe(p1.body.confirmationUrl);
      expect(await prisma.payment.count({ where: { userId: id.boris } })).toBe(1);

      const unknown = await api().post('/payments/webhook').set(WEBHOOK)
        .send({ providerPaymentId: 'fake_unknown', status: 'succeeded' }).expect(200);
      expect(unknown.body.ignored).toBe(true);

      let ticket = await prisma.ticket.findFirstOrThrow({ where: { userId: id.boris } });
      expect(ticket.status).toBe('RESERVED');
      await api().post('/payments/webhook').set(WEBHOOK)
        .send({ providerPaymentId: `fake_${p1.body.id}`, status: 'succeeded' }).expect(200);
      ticket = await prisma.ticket.findFirstOrThrow({ where: { userId: id.boris } });
      expect(ticket.status).toBe('PAID');
    });

    it('таймер снимает просроченные брони', async () => {
      await prisma.ticket.create({
        data: { eventId: id.event, userId: id.egor, reservedUntil: new Date(Date.now() - 60_000) },
      });
      expect(await app.get(PaymentsService).releaseExpiredReservations()).toBe(1);
      const t2 = await prisma.ticket.findFirstOrThrow({ where: { userId: id.egor } });
      expect(t2.status).toBe('RELEASED');
    });

    it('отчёт за период для администратора', async () => {
      const from = new Date(Date.now() - 24 * 3600_000).toISOString();
      const to = new Date(Date.now() + 24 * 3600_000).toISOString();
      const s = await api().get('/admin/stats').query({ from, to }).set(auth('anna')).expect(200);
      expect(s.body.matches).toBe(1);
      expect(s.body.ticketsPaid).toBe(1);
      expect(s.body.revenueKopecks).toBe(34900 + 40000);
    });
  });
});
