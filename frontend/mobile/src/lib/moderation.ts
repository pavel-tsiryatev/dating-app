/** Приоритет жалобы по причине: сервер его не хранит, считаем на клиенте для сортировки очереди. */
export function priority(reason: string): { label: string; tone: 'red' | 'amber' | 'muted'; rank: number } {
  const r = reason.toLowerCase();
  if (/оскорб|угроз|домогат|навязчив/.test(r)) return { label: 'Высокий', tone: 'red', rank: 0 };
  if (/чужие фото|фейк|мошен/.test(r)) return { label: 'Средний', tone: 'amber', rank: 1 };
  return { label: 'Низкий', tone: 'muted', rank: 2 };
}

/** Короткий номер жалобы для людей. */
export const reportNumber = (id: string) => `#${id.replace(/[^0-9a-f]/gi, '').slice(0, 4).toUpperCase() || id.slice(-4)}`;

export const decisions = {
  WARNED: { title: 'Предупреждение', hint: 'Ограничение без блокировки. Пользователь получит уведомление.' },
  BLOCKED: { title: 'Блокировка', hint: 'Аккаунт блокируется за серьёзное нарушение.' },
  REJECTED: { title: 'Отклонить жалобу', hint: 'Нарушений нет, анкета остаётся в ленте.' },
} as const;
