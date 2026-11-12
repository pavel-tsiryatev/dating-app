import { ApiError, type CampusApi, type EventInput, type FeedFilters, type PhotoFile, type ProfileInput } from './api';
import type {
  Block, CampusEvent, DailyStat, Match, Me, Meeting, Message, Partner, Pass, Payment, Person, Photo, Report, Stats,
  Subscription, Ticket,
} from './types';

export const DEMO_CODE = '123456';
const ME = 'demo-me';
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const id = () => `demo-${Math.random().toString(36).slice(2, 10)}`;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const photo = (name: string, n = 0): Photo => ({ id: `${name}-${n}`, storageKey: `/assets/${name}.jpg`, position: n });
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
function future(days: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const people: Person[] = [
  {
    userId: 'demo-anya', name: 'Аня', age: 22, university: 'УрФУ', institute: 'Дизайн · 3 курс', goal: 'DATING',
    about: 'Дизайн, кофе и хорошие разговоры. Люблю концерты, путешествия и спонтанные планы.',
    interests: ['Кино', 'Концерты', 'Кофе', 'Путешествия'], common: 3, photos: [photo('anya'), photo('welcome', 1)],
    quote: 'Пойдём на концерт после пар?',
  },
  {
    userId: 'demo-mark', name: 'Марк', age: 23, university: 'УрФУ', institute: 'ИРИТ-РтФ · 4 курс', goal: 'DATING',
    about: 'Люблю технологии, городские прогулки и живые концерты. Ищу близкого по вайбу человека — для общения, свиданий и всего, что между ними.',
    interests: ['Музыка', 'Игры', 'Кино', 'Спорт', 'Путешествия'], common: 2, photos: [photo('mark')],
    quote: 'Знаю лучший кофе у главного корпуса',
  },
  {
    userId: 'demo-lena', name: 'Лена', age: 23, university: 'УрФУ', institute: 'Психология · 3 курс', goal: 'FRIENDS',
    about: 'Собираю маленькие радости. Пойдём за кофе и обсудим последнюю прочитанную книгу?',
    interests: ['Книги', 'Кофе', 'Кино'], common: 2, photos: [photo('lena')], quote: 'Ищу компанию в книжный клуб',
  },
  {
    userId: 'demo-ilya', name: 'Илья', age: 25, university: 'УрФУ', institute: 'ИРИТ-РтФ · 4 курс', goal: 'ACTIVITIES',
    about: 'Настолки в пятницу, походы на выходных. Всегда рад новой компании.',
    interests: ['Настолки', 'Походы', 'Технологии'], common: 1, photos: [photo('ilya')], quote: 'Кто на настолки в пятницу?',
  },
];

const partnersSeed: Partner[] = [
  { id: 'demo-partner', name: 'Студсовет УрФУ', address: 'Внутренний двор УрФУ, ул. Мира, 19' },
  { id: 'demo-smena', name: 'Кофейня «Смена»', address: 'Екатеринбург, ул. Ленина, 25' },
  { id: 'demo-ceh', name: 'Клуб «Цех»', address: 'Екатеринбург, ул. Ленина, 54' },
];

function eventsSeed(): CampusEvent[] {
  return [
    {
      id: 'demo-concert', title: 'Инди-вечер во дворе', startsAt: future(9, 19), price: 45000, capacity: 60, freeSeats: 32,
      category: 'Концерты', posterUrl: '/assets/concert.jpg', published: true, partnerId: 'demo-partner', partner: partnersSeed[0],
      description: 'Живой концерт, локальные группы, лаунж-зона, еда и напитки. Встретимся после пар!',
    },
    {
      id: 'demo-coffee', title: 'Кофе-знакомство для студентов', startsAt: future(11, 18), price: 25000, capacity: 25, freeSeats: 12,
      category: 'Встречи', posterUrl: '/assets/coffee.jpg', published: true, partnerId: 'demo-smena', partner: partnersSeed[1],
      description: 'Кофе, уют и разговоры с теми, кто тоже ищет своих людей.',
    },
    {
      id: 'demo-party', title: 'Вечеринка «Старт семестра»', startsAt: future(17, 22), price: 60000, capacity: 400, freeSeats: 0,
      category: 'Вечеринки', posterUrl: '/assets/party.jpg', published: true, partnerId: 'demo-ceh', partner: partnersSeed[2],
      description: 'DJ-сеты, танцы и специальное меню для студентов.',
    },
  ];
}

/** Деморежим: все данные в памяти, без сети. Код входа — 123456, деньги не списываются. */
export class DemoApi implements CampusApi {
  readonly demo = true;
  private meData!: Me;
  private feedData!: Person[];
  private liked!: Person[];
  private matchList!: Match[];
  private messageList!: Message[];
  private meetingList!: Meeting[];
  private eventList!: CampusEvent[];
  private ticketList!: Ticket[];
  private paymentList!: (Payment & { eventId?: string; key: string })[];
  private reportList!: Report[];
  private partnerList!: Partner[];
  private blockList!: Block[];
  private premiumUntil: string | null = null;

  constructor() {
    this.reset();
  }

  reset() {
    this.meData = {
      id: ME, universityEmail: 'student@urfu.me', isVerified: true, birthDate: '2002-08-14', role: 'ADMIN', status: 'ACTIVE',
      profile: {
        name: 'Саша', university: 'УрФУ', institute: 'ИнЭУ · 3 курс', goal: 'DATING',
        about: 'Музыка, кофе и хорошие разговоры. Ищу компанию на концерт после пар.',
        interests: ['Кино', 'Концерты', 'Кофе'], photos: [photo('premium')], hideFromInstitute: false, isVisible: true,
        notifications: true, theme: 'light',
      },
    };
    this.feedData = clone(people);
    this.liked = [];
    this.matchList = [{
      id: 'demo-match-anya', createdAt: minutesAgo(90),
      user: { id: 'demo-anya', name: 'Аня', status: 'ACTIVE', photo: '/assets/anya.jpg' }, lastMessage: null,
    }, {
      id: 'demo-match-ilya', createdAt: minutesAgo(60 * 26),
      user: { id: 'demo-ilya', name: 'Илья', status: 'ACTIVE', photo: '/assets/ilya.jpg' }, lastMessage: null,
    }];
    const m = (matchId: string, senderId: string, text: string, ago: number): Message =>
      ({ id: id(), matchId, senderId, clientId: id(), text, sentAt: minutesAgo(ago) });
    this.messageList = [
      m('demo-match-anya', 'demo-anya', 'Привет! Как прошли пары? 😊', 40),
      m('demo-match-anya', ME, 'Привет! Выжил 😄 Кстати, ты не хочешь сходить на концерт в пятницу?', 35),
      m('demo-match-anya', 'demo-anya', 'О, звучит отлично! Я как раз хотела выбраться. Во сколько начинается?', 30),
      m('demo-match-anya', 'demo-anya', 'Тогда на концерт после пар? 🎶', 12),
      m('demo-match-ilya', 'demo-ilya', 'Спасибо за прогулку! Давай повторим в выходные?', 60 * 24),
    ];
    for (const match of this.matchList) {
      match.lastMessage = [...this.messageList].reverse().find((x) => x.matchId === match.id) ?? null;
    }
    this.meetingList = [];
    this.eventList = eventsSeed();
    this.partnerList = clone(partnersSeed);
    this.ticketList = [];
    this.paymentList = [];
    this.blockList = [];
    this.premiumUntil = null;
    this.reportList = [
      {
        id: 'demo-report-1', targetId: 'demo-ilya', reason: 'Оскорбления: неприемлемые сообщения и навязчивое поведение',
        status: 'OPEN', createdAt: minutesAgo(35), target: { id: 'demo-ilya', status: 'ACTIVE', profile: { name: 'Илья' } },
        messages: [m('demo-match-ilya', 'demo-ilya', 'Может, сразу ко мне? 😏', 40)],
      },
      {
        id: 'demo-report-2', targetId: 'demo-mark', reason: 'Чужие фото: похоже, фото принадлежат не ему',
        status: 'OPEN', createdAt: minutesAgo(130), target: { id: 'demo-mark', status: 'ACTIVE', profile: { name: 'Марк' } },
        messages: [],
      },
    ];
  }

  async requestCode() {
    await wait();
  }
  async verifyCode(input: { code: string }) {
    await wait();
    if (input.code !== DEMO_CODE) throw new ApiError(`Неверный код. В деморежиме код — ${DEMO_CODE}`, 422);
    return { accessToken: 'demo', isNew: true };
  }
  async me() {
    return clone(this.meData);
  }
  async saveProfile(input: ProfileInput) {
    await wait();
    const names = [...new Set(input.interests.map((i) => i.trim().toLowerCase()))];
    if (names.length < 3) throw new ApiError('Выбери хотя бы 3 разных интереса', 400);
    this.meData.profile = { ...(this.meData.profile ?? { photos: [] }), ...input, about: input.about ?? null } as Me['profile'];
    return this.me();
  }
  async deleteAccount() {
    this.reset();
  }
  async uploadPhoto(file: PhotoFile) {
    await wait(400);
    const photos = this.meData.profile?.photos ?? [];
    if (photos.length >= 6) throw new ApiError('Можно добавить не больше 6 фото', 400);
    const p = { id: id(), storageKey: file.uri, position: photos.length };
    photos.push(p);
    return clone(p);
  }
  async removePhoto(photoId: string) {
    if (this.meData.profile) this.meData.profile.photos = this.meData.profile.photos.filter((p) => p.id !== photoId);
  }
  async reorderPhotos(ids: string[]) {
    const profile = this.meData.profile;
    if (!profile) return [];
    profile.photos = ids.map((pid, i) => ({ ...profile.photos.find((p) => p.id === pid)!, position: i }));
    return clone(profile.photos);
  }

  async feed(filters: FeedFilters) {
    await wait();
    return clone(this.feedData.filter((p) =>
      (!filters.goal || p.goal === filters.goal)
      && (!filters.minAge || (p.age ?? 0) >= filters.minAge)
      && (!filters.maxAge || (p.age ?? 0) <= filters.maxAge)
      && (!filters.university || p.university === filters.university)
      && (!filters.institute || p.institute.toLowerCase().startsWith(filters.institute.toLowerCase()))
      && !this.blockList.some((b) => b.blockedId === p.userId)));
  }
  async like(userId: string, isLike: boolean) {
    await wait(200);
    const person = people.find((p) => p.userId === userId);
    this.feedData = this.feedData.filter((p) => p.userId !== userId);
    if (!isLike || !person) return { match: false, matchId: null };
    if (!this.liked.some((p) => p.userId === userId)) this.liked.unshift({ ...clone(person), likedAt: new Date().toISOString() });
    // В демо взаимны Аня и Лена — чтобы показать экран «Это взаимно!»
    if (!['demo-anya', 'demo-lena'].includes(userId)) return { match: false, matchId: null };
    let match = this.matchList.find((m) => m.user.id === userId);
    if (!match) {
      match = {
        id: id(), createdAt: new Date().toISOString(), lastMessage: null,
        user: { id: userId, name: person.name, status: 'ACTIVE', photo: person.photos[0]?.storageKey },
      };
      this.matchList.unshift(match);
    }
    return { match: true, matchId: match.id };
  }
  async outgoingLikes() {
    return clone(this.liked);
  }
  async matches() {
    await wait(150);
    return clone(this.matchList.filter((m) => !this.blockList.some((b) => b.blockedId === m.user.id)));
  }
  async messages(matchId: string) {
    return clone(this.messageList.filter((m) => m.matchId === matchId));
  }
  async sendMessage(matchId: string, clientId: string, text: string) {
    const same = this.messageList.find((m) => m.matchId === matchId && m.clientId === clientId);
    if (same) return clone(same);
    const message: Message = { id: id(), matchId, senderId: ME, clientId, text, sentAt: new Date().toISOString() };
    this.messageList.push(message);
    const match = this.matchList.find((m) => m.id === matchId);
    if (match) match.lastMessage = message;
    return clone(message);
  }
  async meetings(matchId: string) {
    return clone(this.meetingList.filter((m) => m.matchId === matchId));
  }
  async proposeMeeting(matchId: string, place: string, meetAt: string) {
    await wait();
    const meeting: Meeting = { id: id(), matchId, proposerId: ME, place, meetAt, status: 'PROPOSED' };
    this.meetingList.push(meeting);
    // Собеседник в демо соглашается через пару секунд
    setTimeout(() => {
      if (meeting.status === 'PROPOSED') meeting.status = 'ACCEPTED';
    }, 2500);
    return clone(meeting);
  }
  async answerMeeting(meetingId: string, status: 'ACCEPTED' | 'DECLINED') {
    const meeting = this.meetingList.find((m) => m.id === meetingId);
    if (!meeting) throw new ApiError('Встреча не найдена', 404);
    meeting.status = status;
    return clone(meeting);
  }
  async block(userId: string) {
    const person = people.find((p) => p.userId === userId);
    if (!this.blockList.some((b) => b.blockedId === userId)) {
      this.blockList.push({ blockedId: userId, blocked: { id: userId, profile: { name: person?.name ?? 'Пользователь' } } });
    }
  }
  async unblock(userId: string) {
    this.blockList = this.blockList.filter((b) => b.blockedId !== userId);
  }
  async blocks() {
    return clone(this.blockList);
  }
  async report(targetId: string, reason: string) {
    await wait();
    const person = people.find((p) => p.userId === targetId);
    this.reportList.unshift({
      id: id(), targetId, reason, status: 'OPEN', createdAt: new Date().toISOString(),
      target: { id: targetId, status: 'ACTIVE', profile: { name: person?.name ?? 'Пользователь' } }, messages: [],
    });
  }

  private taken(eventId: string) {
    return this.ticketList.filter((t) => t.eventId === eventId
      && (t.status === 'PAID' || (t.status === 'RESERVED' && new Date(t.reservedUntil ?? 0) > new Date()))).length;
  }
  private withSeats(e: CampusEvent): CampusEvent {
    const base = eventsSeed().find((s) => s.id === e.id)?.freeSeats ?? e.capacity;
    return { ...e, freeSeats: Math.max(0, base - this.taken(e.id)) };
  }
  async events() {
    await wait(150);
    return clone(this.eventList.filter((e) => e.published).map((e) => this.withSeats(e)));
  }
  async event(eventId: string) {
    const e = this.eventList.find((x) => x.id === eventId);
    if (!e) throw new ApiError('Событие не найдено', 404);
    return clone(this.withSeats(e));
  }
  async tickets() {
    return clone(this.ticketList.map((t) => ({ ...t, event: this.eventList.find((e) => e.id === t.eventId) })));
  }
  async reserve(eventId: string) {
    await wait();
    const event = await this.event(eventId);
    let t = this.ticketList.find((x) => x.eventId === eventId);
    if (t?.status === 'PAID') throw new ApiError('Ты уже идёшь на это событие', 409);
    if (t?.status === 'RESERVED' && new Date(t.reservedUntil ?? 0) > new Date()) return clone(t);
    if (event.freeSeats <= 0) throw new ApiError('Все места заняты', 409);
    if (!t) {
      t = { eventId, userId: ME, status: 'RESERVED', reservedUntil: null };
      this.ticketList.push(t);
    }
    t.status = 'RESERVED';
    t.reservedUntil = new Date(Date.now() + 30 * 60_000).toISOString();
    return clone(t);
  }
  async cancelReservation(eventId: string) {
    const t = this.ticketList.find((x) => x.eventId === eventId);
    if (t && t.status === 'RESERVED') t.status = 'RELEASED';
  }
  async pass(eventId: string): Promise<Pass> {
    const t = this.ticketList.find((x) => x.eventId === eventId);
    if (t?.status !== 'PAID') throw new ApiError('Билет ещё не оплачен', 409);
    return { token: `CAMPUS-DEMO-${eventId}`, checkedInAt: t.checkedInAt ?? null };
  }

  async createPayment(kind: 'TICKET' | 'PREMIUM', eventId: string | undefined, key: string) {
    await wait();
    const same = this.paymentList.find((p) => p.key === key);
    if (same) return clone(same);
    if (kind === 'TICKET') {
      const t = this.ticketList.find((x) => x.eventId === eventId);
      if (t?.status !== 'RESERVED' || new Date(t.reservedUntil ?? 0) <= new Date()) {
        throw new ApiError('Нет действующей брони — забронируй место заново', 409);
      }
    }
    const amount = kind === 'PREMIUM' ? 34900 : this.eventList.find((e) => e.id === eventId)?.price ?? 0;
    const p = {
      id: id(), kind, amount, status: 'PENDING' as const, confirmationUrl: 'demo://sandbox', createdAt: new Date().toISOString(),
      paidAt: null, eventId, key,
    };
    this.paymentList.unshift(p);
    return clone(p);
  }
  async payment(paymentId: string) {
    const p = this.paymentList.find((x) => x.id === paymentId);
    if (!p) throw new ApiError('Платёж не найден', 404);
    const ticket = p.eventId ? this.ticketList.find((t) => t.eventId === p.eventId) : undefined;
    return clone({ ...p, ticket: ticket ? { status: ticket.status, eventId: ticket.eventId } : null, requiresRefund: false });
  }
  async payments() {
    return clone(this.paymentList);
  }
  async subscription(): Promise<Subscription> {
    const active = !!this.premiumUntil && new Date(this.premiumUntil) > new Date();
    return { active, endsAt: active ? this.premiumUntil : null, priceKopecks: 34900 };
  }
  async simulatePayment(paymentId: string, status: 'succeeded' | 'canceled') {
    await wait(600);
    const p = this.paymentList.find((x) => x.id === paymentId);
    if (!p) throw new ApiError('Платёж не найден', 404);
    if (p.status === 'PENDING') {
      p.status = status === 'succeeded' ? 'SUCCEEDED' : 'FAILED';
      if (p.status === 'SUCCEEDED') {
        p.paidAt = new Date().toISOString();
        if (p.kind === 'PREMIUM') this.premiumUntil = new Date(Date.now() + 30 * 86_400_000).toISOString();
        const t = this.ticketList.find((x) => x.eventId === p.eventId);
        if (t) t.status = 'PAID';
      }
    }
    return this.payment(paymentId);
  }

  async adminReports(status: 'OPEN' | 'CLOSED' | 'ALL') {
    return clone(this.reportList.filter((r) => status === 'ALL' || r.status === status));
  }
  async adminReport(reportId: string) {
    const r = this.reportList.find((x) => x.id === reportId);
    if (!r) throw new ApiError('Жалоба не найдена', 404);
    return clone(r);
  }
  async decide(reportId: string, decision: 'REJECTED' | 'WARNED' | 'BLOCKED') {
    await wait();
    const r = this.reportList.find((x) => x.id === reportId);
    if (!r) throw new ApiError('Жалоба не найдена', 404);
    if (r.status === 'CLOSED') throw new ApiError('Жалоба уже рассмотрена', 409);
    r.status = 'CLOSED';
    r.decision = decision;
    if (r.target) r.target.status = decision === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE';
  }
  async partners() {
    return clone(this.partnerList);
  }
  async createPartner(input: { name: string; address: string }) {
    const p = { ...input, id: id() };
    this.partnerList.push(p);
    return clone(p);
  }
  async adminEvents() {
    return clone(this.eventList.map((e) => this.withSeats(e)));
  }
  async createEvent(input: EventInput) {
    await wait();
    const e: CampusEvent = {
      ...input, id: id(), freeSeats: input.capacity, published: input.published ?? true,
      partner: this.partnerList.find((p) => p.id === input.partnerId) ?? null,
    };
    this.eventList.push(e);
    return clone(e);
  }
  async updateEvent(eventId: string, input: Partial<EventInput>) {
    await wait();
    const e = this.eventList.find((x) => x.id === eventId);
    if (!e) throw new ApiError('Событие не найдено', 404);
    Object.assign(e, input);
    if (input.partnerId) e.partner = this.partnerList.find((p) => p.id === input.partnerId) ?? e.partner;
    return clone(e);
  }
  async checkIn(token: string) {
    const t = this.ticketList.find((x) => `CAMPUS-DEMO-${x.eventId}` === token);
    if (!t || t.status !== 'PAID' || t.checkedInAt) throw new ApiError('Билет недействителен или уже использован', 409);
    t.checkedInAt = new Date().toISOString();
  }
  async stats(from: string, to: string): Promise<Stats> {
    return { from, to, newUsers: 248, matches: 86, meetingsAccepted: 42, ticketsPaid: 70, premiumBought: 15, revenueKopecks: 1245000 };
  }
  async dailyStats(from: string, to: string): Promise<DailyStat[]> {
    const start = new Date(from);
    const days = Math.max(1, Math.min(31, Math.round((new Date(to).getTime() - start.getTime()) / 86_400_000)));
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(start.getTime() + i * 86_400_000);
      return { day: d.toISOString().slice(0, 10), registrations: Math.round(4 + i * 0.45 + ((i * 7) % 5)) };
    });
  }
}
