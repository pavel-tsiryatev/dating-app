import { Platform } from 'react-native';
import type {
  Block, CampusEvent, DailyStat, Goal, Match, Me, Meeting, Message, Partner, Pass, Payment, Person, Photo, Profile,
  Report, Stats, Subscription, Ticket,
} from './types';

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

export interface FeedFilters {
  minAge?: number;
  maxAge?: number;
  goal?: Goal;
  university?: string;
  institute?: string;
}

export interface ProfileInput {
  name: string;
  university: string;
  institute: string;
  goal: Goal;
  about?: string;
  interests: string[];
  hideFromInstitute?: boolean;
  isVisible?: boolean;
  notifications?: boolean;
  theme?: string;
}

export interface EventInput {
  partnerId: string;
  title: string;
  startsAt: string;
  capacity: number;
  price: number;
  category?: string;
  description?: string;
  posterUrl?: string;
  published?: boolean;
}

export interface PhotoFile {
  uri: string;
  mimeType: string;
  fileName: string;
}

/** Один интерфейс для настоящего сервера и деморежима: экраны не знают, с чем работают. */
export interface CampusApi {
  readonly demo: boolean;
  requestCode(email: string): Promise<void>;
  verifyCode(input: { email: string; code: string; birthDate?: string; acceptTerms?: boolean }): Promise<{ accessToken: string; isNew: boolean }>;
  me(): Promise<Me>;
  saveProfile(input: ProfileInput): Promise<Me>;
  deleteAccount(): Promise<void>;
  uploadPhoto(file: PhotoFile): Promise<Photo>;
  removePhoto(id: string): Promise<void>;
  reorderPhotos(ids: string[]): Promise<Photo[]>;

  feed(filters: FeedFilters): Promise<Person[]>;
  like(userId: string, isLike: boolean): Promise<{ match: boolean; matchId: string | null }>;
  outgoingLikes(): Promise<Person[]>;
  matches(): Promise<Match[]>;
  messages(matchId: string, before?: string): Promise<Message[]>;
  sendMessage(matchId: string, clientId: string, text: string): Promise<Message>;
  meetings(matchId: string): Promise<Meeting[]>;
  proposeMeeting(matchId: string, place: string, meetAt: string): Promise<Meeting>;
  answerMeeting(id: string, status: 'ACCEPTED' | 'DECLINED'): Promise<Meeting>;
  block(userId: string): Promise<void>;
  unblock(userId: string): Promise<void>;
  blocks(): Promise<Block[]>;
  report(targetId: string, reason: string): Promise<void>;

  events(): Promise<CampusEvent[]>;
  event(id: string): Promise<CampusEvent>;
  tickets(): Promise<Ticket[]>;
  reserve(eventId: string): Promise<Ticket>;
  cancelReservation(eventId: string): Promise<void>;
  pass(eventId: string): Promise<Pass>;

  createPayment(kind: 'TICKET' | 'PREMIUM', eventId: string | undefined, idempotencyKey: string): Promise<Payment>;
  payment(id: string): Promise<Payment>;
  payments(): Promise<Payment[]>;
  subscription(): Promise<Subscription>;
  /** Тестовая оплата (PAYMENT_PROVIDER=fake). */
  simulatePayment(id: string, status: 'succeeded' | 'canceled'): Promise<Payment>;

  adminReports(status: 'OPEN' | 'CLOSED' | 'ALL'): Promise<Report[]>;
  adminReport(id: string): Promise<Report>;
  decide(id: string, decision: 'REJECTED' | 'WARNED' | 'BLOCKED'): Promise<void>;
  partners(): Promise<Partner[]>;
  createPartner(input: { name: string; address: string }): Promise<Partner>;
  adminEvents(): Promise<CampusEvent[]>;
  createEvent(input: EventInput): Promise<CampusEvent>;
  updateEvent(id: string, input: Partial<EventInput>): Promise<CampusEvent>;
  checkIn(token: string): Promise<void>;
  stats(from: string, to: string): Promise<Stats>;
  dailyStats(from: string, to: string): Promise<DailyStat[]>;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Клиент настоящего API. `baseUrl` — адрес NestJS, например http://192.168.1.10:3000. */
export class RemoteApi implements CampusApi {
  readonly demo = false;

  constructor(
    readonly baseUrl: string,
    private token: string | null,
    private readonly onUnauthorized: () => void,
  ) {}

  setToken(token: string | null) {
    this.token = token;
  }

  private async call<T>(path: string, method: Method = 'GET', body?: unknown, headers: Record<string, string> = {}): Promise<T> {
    const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    let response: Response;
    try {
      response = await fetch(this.baseUrl.replace(/\/$/, '') + path, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}),
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : multipart ? (body as FormData) : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      throw new ApiError('Нет связи с сервером CAMPUS. Проверь интернет и адрес сервера.', 0);
    } finally {
      clearTimeout(timer);
    }
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && this.token) this.onUnauthorized();
      const message = Array.isArray(data?.message) ? data.message.join('. ') : data?.message;
      throw new ApiError(message || `Ошибка сервера (${response.status})`, response.status, data?.code);
    }
    return data as T;
  }

  async requestCode(email: string) {
    await this.call('/auth/email/request', 'POST', { email });
  }
  verifyCode(input: { email: string; code: string; birthDate?: string; acceptTerms?: boolean }) {
    return this.call<{ accessToken: string; isNew: boolean }>('/auth/email/verify', 'POST', input);
  }
  me() {
    return this.call<Me>('/profile');
  }
  saveProfile(input: ProfileInput) {
    return this.call<Me>('/profile', 'PUT', input);
  }
  async deleteAccount() {
    await this.call('/profile', 'DELETE');
  }
  async uploadPhoto(file: PhotoFile) {
    const form = new FormData();
    if (Platform.OS === 'web') {
      // В веб-сборке (предпросмотр) нужен настоящий Blob
      form.append('file', await (await fetch(file.uri)).blob(), file.fileName);
    } else {
      // React Native принимает файл как { uri, name, type }
      form.append('file', { uri: file.uri, name: file.fileName, type: file.mimeType } as unknown as Blob);
    }
    return this.call<Photo>('/profile/photos/upload', 'POST', form);
  }
  async removePhoto(id: string) {
    await this.call(`/profile/photos/${id}`, 'DELETE');
  }
  reorderPhotos(ids: string[]) {
    return this.call<Photo[]>('/profile/photos/order', 'PATCH', { ids });
  }

  feed(filters: FeedFilters) {
    const query = Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return this.call<Person[]>(`/feed${query ? `?${query}` : ''}`);
  }
  like(userId: string, isLike: boolean) {
    return this.call<{ match: boolean; matchId: string | null }>('/likes', 'POST', { toUserId: userId, isLike });
  }
  outgoingLikes() {
    return this.call<Person[]>('/likes/outgoing');
  }
  matches() {
    return this.call<Match[]>('/matches');
  }
  messages(matchId: string, before?: string) {
    return this.call<Message[]>(`/matches/${matchId}/messages${before ? `?before=${encodeURIComponent(before)}` : ''}`);
  }
  sendMessage(matchId: string, clientId: string, text: string) {
    return this.call<Message>(`/matches/${matchId}/messages`, 'POST', { clientId, text });
  }
  meetings(matchId: string) {
    return this.call<Meeting[]>(`/matches/${matchId}/meetings`);
  }
  proposeMeeting(matchId: string, place: string, meetAt: string) {
    return this.call<Meeting>(`/matches/${matchId}/meetings`, 'POST', { place, meetAt });
  }
  answerMeeting(id: string, status: 'ACCEPTED' | 'DECLINED') {
    return this.call<Meeting>(`/meetings/${id}`, 'PATCH', { status });
  }
  async block(userId: string) {
    await this.call(`/users/${userId}/block`, 'POST');
  }
  async unblock(userId: string) {
    await this.call(`/users/${userId}/block`, 'DELETE');
  }
  blocks() {
    return this.call<Block[]>('/blocks');
  }
  async report(targetId: string, reason: string) {
    await this.call('/reports', 'POST', { targetId, reason });
  }

  events() {
    return this.call<CampusEvent[]>('/events');
  }
  event(id: string) {
    return this.call<CampusEvent>(`/events/${id}`);
  }
  tickets() {
    return this.call<Ticket[]>('/tickets');
  }
  reserve(eventId: string) {
    return this.call<Ticket>(`/events/${eventId}/tickets`, 'POST');
  }
  async cancelReservation(eventId: string) {
    await this.call(`/events/${eventId}/tickets`, 'DELETE');
  }
  pass(eventId: string) {
    return this.call<Pass>(`/tickets/${eventId}/pass`);
  }

  createPayment(kind: 'TICKET' | 'PREMIUM', eventId: string | undefined, idempotencyKey: string) {
    return this.call<Payment>('/payments', 'POST', { kind, ...(eventId ? { eventId } : {}) }, { 'Idempotency-Key': idempotencyKey });
  }
  payment(id: string) {
    return this.call<Payment>(`/payments/${id}`);
  }
  payments() {
    return this.call<Payment[]>('/payments');
  }
  subscription() {
    return this.call<Subscription>('/subscription');
  }
  simulatePayment(id: string, status: 'succeeded' | 'canceled') {
    return this.call<Payment>(`/payments/${id}/simulate`, 'POST', { status });
  }

  adminReports(status: 'OPEN' | 'CLOSED' | 'ALL') {
    return this.call<Report[]>(`/admin/reports?status=${status}`);
  }
  adminReport(id: string) {
    return this.call<Report>(`/admin/reports/${id}`);
  }
  async decide(id: string, decision: 'REJECTED' | 'WARNED' | 'BLOCKED') {
    await this.call(`/admin/reports/${id}/decision`, 'POST', { decision });
  }
  partners() {
    return this.call<Partner[]>('/admin/partners');
  }
  createPartner(input: { name: string; address: string }) {
    return this.call<Partner>('/admin/partners', 'POST', input);
  }
  adminEvents() {
    return this.call<CampusEvent[]>('/admin/events');
  }
  createEvent(input: EventInput) {
    return this.call<CampusEvent>('/admin/events', 'POST', input);
  }
  updateEvent(id: string, input: Partial<EventInput>) {
    return this.call<CampusEvent>(`/admin/events/${id}`, 'PATCH', input);
  }
  async checkIn(token: string) {
    await this.call('/admin/tickets/check-in', 'POST', { token });
  }
  stats(from: string, to: string) {
    return this.call<Stats>(`/admin/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  }
  dailyStats(from: string, to: string) {
    return this.call<DailyStat[]>(`/admin/stats/daily?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  }
}

export type { Profile };
