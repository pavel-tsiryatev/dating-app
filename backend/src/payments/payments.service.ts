import { Prisma } from '@prisma/client';
import { BadRequestException, ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
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

  /**
   * 51. Создать платёж «ожидает» и получить ссылку на оплату.
   * Повторный запрос (тот же ключ идемпотентности или та же бронь) возвращает тот же платёж
   * с той же ссылкой и не создаёт второй.
   */
  async create(userId: string, kind: PaymentKind, eventId?: string, idempotencyKey?: string) {
    const key = idempotencyKey ?? randomUUID();
    const same = await this.prisma.payment.findUnique({ where: { idempotencyKey: key }, include: { ticket: { select: { eventId: true } } } });
    if (same) {
      if (same.userId !== userId) throw new ConflictException('Ключ идемпотентности уже использован');
      if (same.kind !== kind || (kind === 'TICKET' && same.ticket?.eventId !== eventId)) throw new ConflictException('Ключ идемпотентности уже связан с другим заказом');
      return this.ensureLink(same.id);
    }

    let amount = this.premiumPrice;
    if (kind === 'TICKET') {
      if (!eventId) throw new BadRequestException('Укажите мероприятие');
      const ticket = await this.prisma.ticket.findUnique({
        where: { eventId_userId: { eventId, userId } },
        include: { event: true, payment: true },
      });
      if (!ticket || ticket.status !== 'RESERVED' || ticket.reservedUntil <= new Date()) {
        throw new ConflictException('Нет действующей брони — запишитесь на мероприятие заново');
      }
      if (ticket.payment?.status === 'PENDING') return this.ensureLink(ticket.payment.id);
      amount = ticket.event.price;
    }

    // Платёж и его привязка к брони создаются вместе: не бывает платежа за билет без билета
    const payment = await this.prisma.$transaction(async (tx) => {
      if (kind === 'TICKET') {
        await tx.$queryRaw`SELECT event_id FROM tickets WHERE event_id=${eventId!} AND user_id=${userId} FOR UPDATE`;
        const ticket = await tx.ticket.findUnique({ where: { eventId_userId: { eventId: eventId!, userId } }, include: { payment: true } });
        if (!ticket || ticket.status !== 'RESERVED' || ticket.reservedUntil <= new Date()) throw new ConflictException('Бронь недействительна');
        if (ticket.payment?.status === 'PENDING') return ticket.payment;
      }
      const created = await tx.payment.create({ data: { userId, kind, amount, idempotencyKey: key } });
      if (kind === 'TICKET' && eventId) {
        await tx.ticket.update({
          where: { eventId_userId: { eventId, userId } },
          data: { paymentId: created.id },
        });
      }
      return created;
    }).catch(async (error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: key }, include: { ticket: { select: { eventId: true } } } });
        if (existing?.userId === userId && existing.kind === kind && (kind !== 'TICKET' || existing.ticket?.eventId === eventId)) return existing;
        if (existing) throw new ConflictException('Ключ идемпотентности связан с другим заказом');
      }
      throw error;
    });
    return this.ensureLink(payment.id);
  }

  /**
   * Запрашивает ссылку на оплату у платёжного сервиса, если её ещё нет. Если сервис был недоступен
   * при создании платежа, следующий запрос студента повторит обращение с тем же ключом идемпотентности.
   */
  private async ensureLink(paymentId: string) {
    let p = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { ticket: { include: { event: true } } } });
    if (p.status === 'PENDING' && !p.providerPaymentId) {
      const description = p.kind === 'PREMIUM' ? 'CAMPUS Premium на 30 дней' : `Билет: ${p.ticket?.event.title ?? 'мероприятие'}`;
      const created = await this.provider.createPayment({
        paymentId: p.id, amount: p.amount, description, idempotencyKey: p.idempotencyKey,
      });
      p = await this.prisma.payment.update({
        where: { id: p.id },
        data: { providerPaymentId: created.providerPaymentId, confirmationUrl: created.confirmationUrl },
        include: { ticket: { include: { event: true } } },
      });
    }
    return {
      id: p.id, kind: p.kind, amount: p.amount, status: p.status, idempotencyKey: p.idempotencyKey,
      confirmationUrl: p.status === 'PENDING' ? p.confirmationUrl : null,
    };
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
    if (!payment) {
      // Отвечаем 200, иначе платёжный сервис будет повторять уведомление сутками
      this.log.warn(`Уведомление о неизвестном платеже ${event.providerPaymentId}`);
      return { ok: true, ignored: true };
    }
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

      if (!payment.ticket) return 'refund' as const;
      const events = await tx.$queryRaw<{capacity: number}[]>`SELECT capacity FROM events WHERE event_id=${payment.ticket.eventId} FOR UPDATE`;
      await tx.$queryRaw`SELECT event_id FROM tickets WHERE payment_id=${payment.id} FOR UPDATE`;
      const ticket = await tx.ticket.findUnique({ where: { paymentId: payment.id } });
      // Бронь могли снять и оформить заново — тогда билет уже привязан к другому платежу
      if (!ticket) return 'refund' as const;
      if (ticket.status === 'RELEASED' || ticket.reservedUntil <= new Date()) {
        // Бронь уже снята по таймеру: подтверждаем, только если место ещё свободно.
        const taken = await tx.ticket.count({
          where: {
            eventId: ticket.eventId,
            OR: [{ status: 'PAID' }, { status: 'RESERVED', reservedUntil: { gt: new Date() } }],
          },
        });
        if (!events.length || taken >= events[0].capacity) return 'refund' as const;
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
      this.log.warn(`Платёж ${payment.id} оплачен, но билет выдать нельзя — нужен возврат`);
      await this.notifications.notify(payment.userId, 'Бронь истекла, билет выдать не получилось. Деньги вернём');
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
    if (to <= from || to.getTime() - from.getTime() > 366 * 86400000) throw new BadRequestException('Выберите период от 1 до 366 дней');
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
}
