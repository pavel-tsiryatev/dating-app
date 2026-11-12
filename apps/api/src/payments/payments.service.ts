import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaymentKind } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { premiumPeriod } from '../common/rules';
import { NotificationsService } from '../notifications/notifications.service';
import { PAYMENT_PROVIDER, PaymentProvider, WebhookEvent } from './payment-provider';

/** Блок A5 «Принимать и проверять оплату»: задачи 51–53. */
@Injectable()
export class PaymentsService {
  private readonly log = new Logger('Payments');
  private readonly premiumPrice: number;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {
    this.premiumPrice = Number(config.get('PREMIUM_PRICE_KOPECKS') ?? 34900);
  }

  /** 51. Создать платёж «ожидает» и получить ссылку на оплату. */
  async create(userId: string, kind: PaymentKind, eventId?: string, idempotencyKey?: string) {
    const key = idempotencyKey ?? randomUUID();
    const same = await this.prisma.payment.findUnique({ where: { idempotencyKey: key } });
    if (same) {
      if (same.userId !== userId) throw new ConflictException('Ключ идемпотентности уже использован');
      return this.view(same.id);
    }

    let amount = this.premiumPrice;
    let description = 'CAMPUS Premium на 30 дней';
    if (kind === 'TICKET') {
      if (!eventId) throw new BadRequestException('Укажите мероприятие');
      const ticket = await this.prisma.ticket.findUnique({
        where: { eventId_userId: { eventId, userId } },
        include: { event: true, payment: true },
      });
      if (!ticket || ticket.status !== 'RESERVED' || ticket.reservedUntil <= new Date()) {
        throw new ConflictException('Нет действующей брони — запишитесь на мероприятие заново');
      }
      if (ticket.payment?.status === 'PENDING') return this.view(ticket.payment.id);
      amount = ticket.event.price;
      description = `Билет: ${ticket.event.title}`;
    }

    const payment = await this.prisma.payment.create({ data: { userId, kind, amount, idempotencyKey: key } });
    if (kind === 'TICKET' && eventId) {
      await this.prisma.ticket.update({
        where: { eventId_userId: { eventId, userId } },
        data: { paymentId: payment.id },
      });
    }
    const created = await this.provider.createPayment({ paymentId: payment.id, amount, description, idempotencyKey: key });
    await this.prisma.payment.update({ where: { id: payment.id }, data: { providerPaymentId: created.providerPaymentId } });
    return { ...(await this.view(payment.id)), confirmationUrl: created.confirmationUrl };
  }

  /**
   * 52. Проверка оплаты по уведомлению платёжного сервиса.
   * Повторное уведомление ничего не меняет (R1): статус меняется только из PENDING.
   */
  async handleWebhook(headers: Record<string, string | string[] | undefined>, body: unknown) {
    const event: WebhookEvent = await this.provider.parseWebhook(headers, body);
    const payment = await this.prisma.payment.findUnique({
      where: { providerPaymentId: event.providerPaymentId },
      include: { ticket: { include: { event: true } } },
    });
    if (!payment) throw new NotFoundException('Платёж не найден');
    if (payment.status !== 'PENDING') return { ok: true, duplicate: true };

    if (event.status === 'canceled') {
      await this.prisma.payment.updateMany({ where: { id: payment.id, status: 'PENDING' }, data: { status: 'FAILED' } });
      await this.notifications.notify(payment.userId, 'Оплата не прошла. Попробуйте ещё раз');
      return { ok: true };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.payment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: { status: 'SUCCEEDED', paidAt: new Date() },
      });
      if (!count) return 'duplicate' as const;

      if (payment.kind === 'PREMIUM') {
        const last = await tx.subscription.findFirst({
          where: { payment: { userId: payment.userId } },
          orderBy: { endsAt: 'desc' },
        });
        await tx.subscription.create({ data: { paymentId: payment.id, ...premiumPeriod(last?.endsAt ?? null) } });
        return 'premium' as const;
      }

      const ticket = payment.ticket;
      if (!ticket) return 'no-ticket' as const;
      if (ticket.status === 'RELEASED') {
        // Бронь уже снята по таймеру: подтверждаем, только если место ещё свободно.
        const taken = await tx.ticket.count({
          where: {
            eventId: ticket.eventId,
            OR: [{ status: 'PAID' }, { status: 'RESERVED', reservedUntil: { gt: new Date() } }],
          },
        });
        if (taken >= ticket.event.capacity) return 'refund' as const;
      }
      await tx.ticket.update({
        where: { eventId_userId: { eventId: ticket.eventId, userId: ticket.userId } },
        data: { status: 'PAID' },
      });
      return 'ticket' as const;
    });

    if (result === 'premium') await this.notifications.notify(payment.userId, 'Premium активирован на 30 дней');
    if (result === 'ticket') await this.notifications.notify(payment.userId, 'Билет оплачен, ждём вас!');
    if (result === 'refund') {
      this.log.warn(`Платёж ${payment.id} прошёл после снятия брони, мест нет — нужен возврат`);
      await this.notifications.notify(payment.userId, 'Бронь истекла, а места закончились. Деньги вернём');
    }
    return { ok: true, duplicate: result === 'duplicate' };
  }

  /** Таймер из модели: снимает брони старше 30 минут без оплаты (сценарий С5, UOW 5.8). */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async releaseExpiredReservations() {
    const { count } = await this.prisma.ticket.updateMany({
      where: { status: 'RESERVED', reservedUntil: { lt: new Date() } },
      data: { status: 'RELEASED' },
    });
    if (count) this.log.log(`Снято просроченных броней: ${count}`);
    return count;
  }

  /**
   * 53. Отчёт за период (обезличенные агрегаты). Удержание D7 добавится, когда появится
   * журнал активности пользователей.
   */
  async stats(from: Date, to: Date) {
    const period = { gte: from, lt: to };
    const [newUsers, matches, meetingsAccepted, ticketsPaid, revenue, premiumBought] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: period } }),
      this.prisma.match.count({ where: { createdAt: period } }),
      this.prisma.meeting.count({ where: { status: 'ACCEPTED', meetAt: period } }),
      this.prisma.payment.count({ where: { kind: 'TICKET', status: 'SUCCEEDED', paidAt: period } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCEEDED', paidAt: period }, _sum: { amount: true } }),
      this.prisma.payment.count({ where: { kind: 'PREMIUM', status: 'SUCCEEDED', paidAt: period } }),
    ]);
    return {
      from, to, newUsers, matches, meetingsAccepted, ticketsPaid, premiumBought,
      revenueKopecks: revenue._sum.amount ?? 0,
    };
  }

  private async view(id: string) {
    const p = await this.prisma.payment.findUniqueOrThrow({ where: { id } });
    return { id: p.id, kind: p.kind, amount: p.amount, status: p.status, idempotencyKey: p.idempotencyKey };
  }
}
