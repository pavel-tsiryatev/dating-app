import { makeId } from './text';

/**
 * Ключ идемпотентности платежа: один на заказ, пока он не оплачен или не отклонён.
 * Повторное нажатие «Оплатить» после обрыва сети вернёт тот же платёж, а не создаст второй.
 */
const keys = new Map<string, string>();

export function paymentKey(kind: 'TICKET' | 'PREMIUM', eventId?: string) {
  const slot = `${kind}:${eventId ?? ''}`;
  let key = keys.get(slot);
  if (!key) {
    key = makeId();
    keys.set(slot, key);
  }
  return key;
}

export function forgetPaymentKey(kind: 'TICKET' | 'PREMIUM', eventId?: string) {
  keys.delete(`${kind}:${eventId ?? ''}`);
}

/** Ссылка тестового провайдера (PAYMENT_PROVIDER=fake) или деморежима — оплату подтверждаем прямо в приложении. */
export const isSandboxUrl = (url: string | null | undefined) => !url || url.startsWith('demo://') || /\/payments\/[^/]+\/sandbox$/.test(url);
