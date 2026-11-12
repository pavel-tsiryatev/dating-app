import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface CreatePaymentInput {
  paymentId: string;
  amount: number; // копейки
  description: string;
  idempotencyKey: string;
}

export interface WebhookEvent {
  providerPaymentId: string;
  status: 'succeeded' | 'canceled';
}

/** Платёжный сервис (внешняя система из модели). Реализации: тестовая заглушка, позже ЮKassa. */
export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<{ providerPaymentId: string; confirmationUrl: string }>;
  /** Проверяет подлинность уведомления и возвращает его содержимое. */
  parseWebhook(headers: Record<string, string | string[] | undefined>, body: unknown): Promise<WebhookEvent>;
}

/**
 * Тестовая заглушка для учебной версии: ничего не списывает. Уведомление об оплате
 * имитируется запросом на /payments/webhook с заголовком X-Webhook-Secret.
 *
 * Для ЮKassa: createPayment → POST /v3/payments (заголовок Idempotence-Key = idempotencyKey),
 * а в parseWebhook не доверять телу запроса, а перезапросить статус GET /v3/payments/{id}.
 */
@Injectable()
export class FakePaymentProvider implements PaymentProvider {
  private readonly secret: Buffer;

  constructor(config: ConfigService) {
    this.secret = Buffer.from(config.getOrThrow<string>('PAYMENT_WEBHOOK_SECRET'));
  }

  async createPayment(input: CreatePaymentInput) {
    const providerPaymentId = `fake_${input.paymentId}`;
    return { providerPaymentId, confirmationUrl: `${process.env.PUBLIC_API_BASE || "http://localhost:5173/api"}/payments/${input.paymentId}/sandbox` };
  }

  async parseWebhook(headers: Record<string, string | string[] | undefined>, body: unknown): Promise<WebhookEvent> {
    const given = Buffer.from(String(headers['x-webhook-secret'] ?? ''));
    if (given.length !== this.secret.length || !timingSafeEqual(given, this.secret)) {
      throw new UnauthorizedException('Неверная подпись уведомления');
    }
    const b = body as Partial<WebhookEvent>;
    if (typeof b?.providerPaymentId !== 'string' || (b.status !== 'succeeded' && b.status !== 'canceled')) {
      throw new UnauthorizedException('Неверный формат уведомления');
    }
    return { providerPaymentId: b.providerPaymentId, status: b.status };
  }
}
