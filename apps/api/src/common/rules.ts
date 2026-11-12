/**
 * Бизнес-правила из модели (раздел 1, «Бизнес-правила»). Чистые функции без доступа к базе —
 * их легко проверить юнит-тестами.
 */
import { createHash, randomInt } from 'crypto';

export const MIN_AGE = 18;
export const FREE_LIKES_PER_DAY = 30;
export const MIN_INTERESTS = 3;
export const MAX_INTERESTS = 10;
export const MAX_PHOTOS = 6;
export const REPORTS_TO_HIDE = 3;
export const CODE_TTL_SECONDS = 10 * 60;
export const CODE_MAX_ATTEMPTS = 3;
export const CODE_LOCK_SECONDS = 15 * 60;
export const TICKET_RESERVATION_MINUTES = 30;
export const PREMIUM_DAYS = 30;
/** Сутки для лимита лайков считаются по времени Екатеринбурга (UTC+5) */
export const LOCAL_UTC_OFFSET_HOURS = 5;

/** Правило 1: только 18+. Возраст считается по дате рождения на дату `now`. */
export function ageOn(birthDate: Date, now: Date): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = now.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birthDate.getUTCDate())) age--;
  return age;
}

export function isAdult(birthDate: Date, now = new Date()): boolean {
  return ageOn(birthDate, now) >= MIN_AGE;
}

/** Правило 2: почта должна быть в домене вуза. Поддомены разрешены (student.urfu.ru). */
export function isUniversityEmail(email: string, domains: string[]): boolean {
  const at = email.lastIndexOf('@');
  if (at < 1) return false;
  const host = email.slice(at + 1).toLowerCase();
  return domains.some((d) => host === d || host.endsWith('.' + d));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Правило 4: бесплатно 30 лайков в сутки, с Premium — без лимита. */
export function canLike(likesToday: number, hasPremium: boolean): boolean {
  return hasPremium || likesToday < FREE_LIKES_PER_DAY;
}

/** Начало текущих суток по местному времени, в UTC. */
export function startOfLocalDay(now = new Date()): Date {
  const shifted = new Date(now.getTime() + LOCAL_UTC_OFFSET_HOURS * 3600_000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - LOCAL_UTC_OFFSET_HOURS * 3600_000);
}

/** Пара в совпадении хранится упорядоченно, чтобы для двух людей была ровно одна запись. */
export function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** В хранилище кодов лежит только хеш (как в модели, раздел 11.4). */
export function hashCode(email: string, code: string, secret: string): string {
  return createHash('sha256').update(`${secret}:${normalizeEmail(email)}:${code}`).digest('hex');
}

/** Premium продлевается от даты окончания текущей подписки, если она ещё действует. */
export function premiumPeriod(currentEnd: Date | null, now = new Date()): { startsAt: Date; endsAt: Date } {
  const startsAt = currentEnd && currentEnd > now ? currentEnd : now;
  const endsAt = new Date(startsAt.getTime() + PREMIUM_DAYS * 24 * 3600_000);
  return { startsAt, endsAt };
}
