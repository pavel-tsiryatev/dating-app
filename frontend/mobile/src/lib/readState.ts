/**
 * Какие сообщения уже прочитаны на этом устройстве (для красного счётчика в списке чатов).
 * Сервер пока не хранит «прочитано», поэтому отметка живёт до перезапуска приложения.
 */
const lastRead = new Map<string, string>();

export function markRead(matchId: string, sentAt: string | undefined) {
  if (!sentAt) return;
  const prev = lastRead.get(matchId);
  if (!prev || prev < sentAt) lastRead.set(matchId, sentAt);
}

export function isUnread(matchId: string, sentAt: string | undefined) {
  if (!sentAt) return false;
  const prev = lastRead.get(matchId);
  return !prev || prev < sentAt;
}
