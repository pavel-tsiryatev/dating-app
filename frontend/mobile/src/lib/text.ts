// Чистые функции без React Native: их проверяют тесты в tests/text.test.ts

export function money(kopecks: number) {
  const rub = Math.round(kopecks / 100);
  return `${rub.toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`;
}

const monthsGenitive = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const weekdays = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const weekdaysShort = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Крупные суммы для плиток отчёта: 12 450 ₽ → «12,5 тыс ₽». */
export function compactMoney(kopecks: number) {
  const rub = kopecks / 100;
  if (rub < 10_000) return money(kopecks);
  // toFixed округляет 12,45 вниз из-за двоичной записи, поэтому округляем сами
  const short = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',');
  if (rub < 1_000_000) return `${short(rub / 1000)} тыс ₽`;
  return `${short(rub / 1_000_000)} млн ₽`;
}

export function time(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** «21 ноября, 19:00» */
export function dateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${monthsGenitive[d.getMonth()]}, ${time(iso)}`;
}

/** «21 ноября, пятница • 19:00» */
export function dateLong(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${monthsGenitive[d.getMonth()]}, ${weekdays[d.getDay()]} • ${time(iso)}`;
}

/** «21 ноября, пт» */
export function dateShort(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${monthsGenitive[d.getMonth()]}, ${weekdaysShort[d.getDay()]}`;
}

/** Время для списка чатов: сегодня — часы, вчера — «Вчера», раньше — день недели или дата. */
export function chatTime(iso: string, now = new Date()) {
  const d = new Date(iso);
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (days <= 0) return time(iso);
  if (days === 1) return 'Вчера';
  if (days < 7) return weekdaysShort[d.getDay()].replace(/^./, (c) => c.toUpperCase());
  return `${d.getDate()}.${pad(d.getMonth() + 1)}`;
}

export function age(birthDate: string, now = new Date()) {
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return 0;
  const before = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  return now.getFullYear() - d.getFullYear() - (before ? 1 : 0);
}

export function remaining(until: string | null | undefined, now = Date.now()) {
  const seconds = Math.max(0, Math.ceil((new Date(until ?? 0).getTime() - now) / 1000));
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** Нормализация адреса сервера, который вводит пользователь. */
export function normalizeApiUrl(input: string) {
  let url = input.trim();
  if (!url) return '';
  if (!/^https?:\/\//.test(url)) url = `http://${url}`;
  return url.replace(/\/+$/, '');
}

export function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Простое склонение имени для фраз «Написать Ане», «Вы с Аней».
 * Покрывает частые русские имена; для остальных возвращает имя как есть.
 */
export function nameCase(name: string, kase: 'dative' | 'instrumental') {
  const n = name.trim();
  if (!/^[А-ЯЁ][а-яё]+$/.test(n)) return n;
  const last = n.slice(-1);
  const stem = n.slice(0, -1);
  if (last === 'а') return kase === 'dative' ? `${stem}е` : `${stem}${/[жчшщц]$/.test(stem) ? 'ей' : 'ой'}`;
  if (last === 'я') return kase === 'dative' ? `${stem}${stem.endsWith('и') ? 'и' : 'е'}` : `${stem}ей`;
  if (last === 'й') return kase === 'dative' ? `${stem}ю` : `${stem}ем`;
  if (last === 'ь') return n; // Любовь / Игорь — неоднозначно
  if (/[бвгдзклмнпрстфхжчшщц]$/.test(n)) return kase === 'dative' ? `${n}у` : `${n}${/[жчшщц]$/.test(n) ? 'ем' : 'ом'}`;
  return n;
}
