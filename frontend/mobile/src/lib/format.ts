import type { ImageSourcePropType } from 'react-native';
import type { Goal } from './types';

export * from './text';

export const goals: Record<Goal, string> = {
  DATING: 'Знакомства и отношения',
  FRIENDS: 'Новые друзья',
  ACTIVITIES: 'Совместные активности',
};

export const goalShort: Record<Goal, string> = {
  DATING: 'Отношения',
  FRIENDS: 'Общение',
  ACTIVITIES: 'Совместные активности',
};

export const interestOptions = [
  'Кино', 'Концерты', 'Кофе', 'Путешествия', 'Музыка', 'Спорт', 'Настолки', 'Искусство', 'Технологии', 'Книги',
  'Походы', 'Игры', 'Фотография', 'Танцы',
];

export const universities = [
  { short: 'УрФУ', full: 'Уральский федеральный университет' },
  { short: 'УГМУ', full: 'Уральский государственный медицинский университет' },
  { short: 'УрГЭУ', full: 'Уральский государственный экономический университет' },
  { short: 'УрГЮУ', full: 'Уральский государственный юридический университет' },
  { short: 'УрГПУ', full: 'Уральский государственный педагогический университет' },
  { short: 'УрГАХУ', full: 'Уральский государственный архитектурно-художественный университет' },
];

export const institutes = [
  'ИРИТ-РтФ', 'ИЕНиМ', 'ИнЭУ', 'УГИ', 'ИСА', 'ИНМиТ', 'ИФКСиМП', 'ИнФО', 'ФТИ', 'ХТИ', 'Дизайн', 'Психология',
  'Медицина', 'Экономика', 'Право', 'Другое',
];

export const months = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const local: Record<string, ImageSourcePropType> = {
  '/assets/anya.jpg': require('../../assets/anya.jpg'),
  '/assets/mark.jpg': require('../../assets/mark.jpg'),
  '/assets/lena.jpg': require('../../assets/lena.jpg'),
  '/assets/ilya.jpg': require('../../assets/ilya.jpg'),
  '/assets/coffee.jpg': require('../../assets/coffee.jpg'),
  '/assets/concert.jpg': require('../../assets/concert.jpg'),
  '/assets/party.jpg': require('../../assets/party.jpg'),
  '/assets/premium.jpg': require('../../assets/premium.jpg'),
  '/assets/welcome.jpg': require('../../assets/welcome.jpg'),
};

/**
 * Источник картинки по storageKey/posterUrl.
 * - `/assets/…` — фото из деморежима, лежат в приложении;
 * - `/api/media/…` — загруженные на сервер: путь `/api` есть только у веб-прокси, сам API отдаёт `/media/…`;
 * - `file://`, `content://` — только что выбранное в деморежиме фото с устройства;
 * - `https://` — постеры событий от администратора.
 * Остальное (внешний http, ключи хранилища без загрузки) не показываем.
 */
export function mediaSource(key: string | null | undefined, apiBase: string | null): ImageSourcePropType | null {
  if (!key) return null;
  if (local[key]) return local[key];
  const media = key.match(/^\/api\/media\/([a-f0-9-]{36}\.(?:jpg|png|webp))$/);
  if (media && apiBase) return { uri: `${apiBase.replace(/\/$/, '')}/media/${media[1]}` };
  if (/^(file|content|ph):\/\//.test(key)) return { uri: key };
  if (/^https:\/\//.test(key)) return { uri: key };
  return null;
}

export const fallbackPhoto: ImageSourcePropType = require('../../assets/welcome.jpg');
export const fallbackPoster: ImageSourcePropType = require('../../assets/concert.jpg');

