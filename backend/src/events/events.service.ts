import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TICKET_RESERVATION_MINUTES } from '../common/rules';
import { CreateEventDto, CreatePartnerDto } from './dto/events.dto';

/** Блок A4 «Проводить мероприятия»: задачи 41–43. */
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 41. */
  createPartner(dto: CreatePartnerDto) {
    return this.prisma.partner.create({ data: dto });
  }

  /** 42. */
  async createEvent(dto: CreateEventDto) {
    if (!await this.prisma.partner.findUnique({ where: { id: dto.partnerId } })) throw new BadRequestException('Партнёр не найден');
    const startsAt = new Date(dto.startsAt);
    if (startsAt <= new Date()) throw new BadRequestException('Мероприятие должно быть в будущем');
    return this.prisma.event.create({ data: { ...dto, startsAt } });
  }

  /** Афиша: будущие мероприятия и число свободных мест. */
  async upcoming() {
    const events = await this.prisma.event.findMany({
      where: { startsAt: { gt: new Date() }, published: true },
      orderBy: { startsAt: 'asc' },
      include: { partner: { select: { name: true, address: true } } },
    });
    const taken = await this.prisma.ticket.groupBy({
      by: ['eventId'],
      where: { eventId: { in: events.map((e) => e.id) }, ...this.occupiedWhere() },
      _count: true,
    });
    return events.map((e) => ({
      ...e,
      freeSeats: e.capacity - (taken.find((t) => t.eventId === e.id)?._count ?? 0),
    }));
  }

  /**
   * 43. Бронь места на 30 минут. Строка мероприятия блокируется (FOR UPDATE),
   * чтобы два студента не заняли последнее место одновременно.
   */
  async reserve(userId: string, eventId: string) {
    const reservedUntil = new Date(Date.now() + TICKET_RESERVATION_MINUTES * 60_000);
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ capacity: number; starts_at: Date; published: boolean }[]>`
        SELECT capacity, starts_at, published FROM events WHERE event_id = ${eventId} FOR UPDATE`;
      if (!rows.length || !rows[0].published) throw new NotFoundException('Мероприятие не найдено');
      if (rows[0].starts_at <= new Date()) throw new BadRequestException('Мероприятие уже прошло');

      const existing = await tx.ticket.findUnique({ where: { eventId_userId: { eventId, userId } } });
      if (existing?.status === 'PAID') throw new ConflictException('Вы уже записаны');
      if (existing?.status === 'RESERVED' && existing.reservedUntil > new Date()) {
        return existing;
      }
      const taken = await tx.ticket.count({ where: { eventId, ...this.occupiedWhere() } });
      if (taken >= rows[0].capacity) throw new ConflictException('Мест нет');

      return tx.ticket.upsert({
        where: { eventId_userId: { eventId, userId } },
        create: { eventId, userId, reservedUntil },
        update: { status: 'RESERVED', reservedUntil, paymentId: null },
      });
    });
  }

  myTickets(userId: string) {
    return this.prisma.ticket.findMany({ where: { userId }, include: { event: { include: { partner: true } } } });
  }

  /** Место занято, если билет оплачен или бронь ещё не истекла. */
  private occupiedWhere() {
    return {
      OR: [{ status: 'PAID' as const }, { status: 'RESERVED' as const, reservedUntil: { gt: new Date() } }],
    };
  }
}
