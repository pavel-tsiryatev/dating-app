import { FeedQueryDto } from './dto/matching.dto';
import { ageOn } from '../common/rules';
import {
  BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { canLike, MIN_INTERESTS, orderPair, startOfLocalDay } from '../common/rules';
import { NotificationsService } from '../notifications/notifications.service';

interface FeedRow {
  userId: string;
  name: string;
  birthDate: Date;
  university: string;
  institute: string;
  goal: string;
  about: string | null;
  common: bigint;
}

/** Блок A2 «Организовать знакомства»: задачи 21–24. */
@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  /**
   * 21. Лента: только подтверждённые активные пользователи с фото и ≥ 3 интересами,
   * без уже оценённых, с учётом «скрыть от своего института». Сначала — больше общих интересов.
   */
  async feed(me: string, limit: number, filters: Partial<FeedQueryDto> = {}) {
    if ((filters.minAge ?? 18) > (filters.maxAge ?? 100)) throw new BadRequestException('Неверный диапазон возраста');
    const myProfile = await this.prisma.profile.findUnique({ where: { userId: me } });
    if (!myProfile) throw new ConflictException('Сначала заполните анкету');

    const rows = await this.prisma.$queryRaw<FeedRow[]>(Prisma.sql`
      SELECT u.user_id AS "userId", p.name, p.university, p.institute, p.goal::text AS goal, p.about, u.birth_date AS "birthDate",
        (SELECT count(*) FROM profile_interests pi2
          WHERE pi2.user_id = u.user_id
            AND pi2.interest_id IN (SELECT interest_id FROM profile_interests WHERE user_id = ${me})) AS common
      FROM users u
      JOIN profiles p ON p.user_id = u.user_id
      WHERE u.user_id <> ${me}
        AND u.status = 'ACTIVE' AND u.is_verified AND p.is_visible
        AND (${filters.goal ?? null}::text IS NULL OR p.goal::text = ${filters.goal ?? null})
        AND (${filters.university ?? null}::text IS NULL OR p.university = ${filters.university ?? null})
        AND (${filters.institute ?? null}::text IS NULL OR p.institute = ${filters.institute ?? null})
        AND date_part('year', age(CURRENT_DATE, u.birth_date)) BETWEEN ${filters.minAge ?? 18} AND ${filters.maxAge ?? 100}
        AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id = ${me} AND b.blocked_id = u.user_id) OR (b.blocked_id = ${me} AND b.blocker_id = u.user_id))
        AND EXISTS (SELECT 1 FROM photos ph WHERE ph.user_id = u.user_id)
        AND (SELECT count(*) FROM profile_interests pi WHERE pi.user_id = u.user_id) >= ${MIN_INTERESTS}
        AND NOT EXISTS (SELECT 1 FROM likes l WHERE l.from_user_id = ${me} AND l.to_user_id = u.user_id)
        AND NOT (
          (p.hide_from_institute OR ${myProfile.hideFromInstitute})
          AND p.university = ${myProfile.university} AND p.institute = ${myProfile.institute}
        )
      ORDER BY common DESC, u.created_at DESC
      LIMIT ${limit}
    `);
    if (!rows.length) return [];

    const ids = rows.map((r) => r.userId);
    const [photos, interests] = await Promise.all([
      this.prisma.photo.findMany({ where: { userId: { in: ids } }, orderBy: { position: 'asc' } }),
      this.prisma.profileInterest.findMany({ where: { userId: { in: ids } }, include: { interest: true } }),
    ]);
    return rows.map((r) => ({
      ...(({ birthDate, ...rest }) => ({ ...rest, age: ageOn(birthDate, new Date()) }))(r),
      common: Number(r.common),
      photos: photos.filter((p) => p.userId === r.userId).map((p) => ({ id: p.id, storageKey: p.storageKey })),
      interests: interests.filter((i) => i.userId === r.userId).map((i) => i.interest.name),
    }));
  }

  /** 22. Лайк или пропуск. Взаимный лайк создаёт совпадение в той же транзакции. */
  async rate(me: string, toUserId: string, isLike: boolean) {
    if (me === toUserId) throw new BadRequestException('Нельзя оценить себя');
    const [mine, target] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId: me }, select: { userId: true } }),
      this.prisma.user.findUnique({
        where: { id: toUserId },
        select: { status: true, isVerified: true, profile: { select: { userId: true } } },
      }),
    ]);
    // Оценивать можно только тех, кто виден в ленте, и только имея свою анкету:
    // иначе получится совпадение с человеком, который вас не видел.
    if (!mine) throw new ConflictException('Сначала заполните анкету');
    if (!target || target.status !== 'ACTIVE' || !target.isVerified || !target.profile) {
      throw new NotFoundException('Анкета недоступна');
    }

    const [mineFull, targetFull, block] = await Promise.all([
      this.prisma.profile.findUniqueOrThrow({ where: { userId: me } }),
      this.prisma.profile.findUniqueOrThrow({ where: { userId: toUserId }, include: { photos: true, interests: true } }),
      this.prisma.userBlock.findFirst({ where: { OR: [{ blockerId: me, blockedId: toUserId }, { blockerId: toUserId, blockedId: me }] } }),
    ]);
    if (block || !targetFull.isVisible || !targetFull.photos.length || targetFull.interests.length < MIN_INTERESTS ||
        ((mineFull.hideFromInstitute || targetFull.hideFromInstitute) && mineFull.university === targetFull.university && mineFull.institute === targetFull.institute)) throw new NotFoundException('Анкета недоступна');
    if (isLike) {
      const [likesToday, premium] = await Promise.all([
        this.prisma.like.count({ where: { fromUserId: me, isLike: true, createdAt: { gte: startOfLocalDay() } } }),
        this.hasPremium(me),
      ]);
      if (!canLike(likesToday, premium)) {
        throw new HttpException(
          { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: 'Лимит лайков на сегодня исчерпан', code: 'LIKE_LIMIT' },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    try {
      const matchId = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT user_id FROM users WHERE user_id=${me} FOR UPDATE`;
        if (isLike) {
          const count = await tx.like.count({ where: { fromUserId: me, isLike: true, createdAt: { gte: startOfLocalDay() } } });
          const premium = !!await tx.subscription.findFirst({ where: { payment: { userId: me }, endsAt: { gt: new Date() } } });
          if (!canLike(count, premium)) throw new HttpException({ message: 'Лимит лайков на сегодня исчерпан', code: 'LIKE_LIMIT' }, HttpStatus.TOO_MANY_REQUESTS);
        }
        await tx.like.create({ data: { fromUserId: me, toUserId, isLike } });
        if (!isLike) return null;
        const reverse = await tx.like.findUnique({
          where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: me } },
        });
        if (!reverse?.isLike) return null;
        const [userAId, userBId] = orderPair(me, toUserId);
        const match = await tx.match.upsert({
          where: { userAId_userBId: { userAId, userBId } },
          create: { userAId, userBId },
          update: {},
        });
        return match.id;
      });
      if (matchId) {
        await Promise.all([me, toUserId].map((u) => this.notifications.notify(u, 'У вас новое совпадение!')));
      }
      return { match: !!matchId, matchId };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Вы уже оценили эту анкету');
      }
      throw e;
    }
  }

  async matches(me: string) {
    const list = await this.prisma.match.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      orderBy: { createdAt: 'desc' },
      include: {
        userA: { select: { id: true, status: true, profile: { select: { name: true } } } },
        userB: { select: { id: true, status: true, profile: { select: { name: true } } } },
        messages: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
    });
    const blocks = await this.prisma.userBlock.findMany({ where: { OR: [{ blockerId: me }, { blockedId: me }] } });
    const blocked = new Set(blocks.flatMap(b => [b.blockerId, b.blockedId]));
    return list
      .map((m) => {
        const other = m.userAId === me ? m.userB : m.userA;
        return { id: m.id, createdAt: m.createdAt, user: { id: other.id, name: other.profile?.name, status: other.status },
          lastMessage: m.messages[0] ?? null };
      })
      .filter((m) => m.user.status !== 'BLOCKED' && !blocked.has(m.user.id));
  }

  /** Проверка доступа к переписке: только два участника совпадения (правило доступа (2) из ТЗ). */
  async assertParticipant(me: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Совпадение не найдено');
    if (match.userAId !== me && match.userBId !== me) throw new ForbiddenException('Это не ваша переписка');
    const other = match.userAId === me ? match.userBId : match.userAId;
    const block = await this.prisma.userBlock.findFirst({ where: { OR: [{ blockerId: me, blockedId: other }, { blockerId: other, blockedId: me }] } });
    if (block) throw new ForbiddenException('Общение с этим пользователем недоступно');
    return match;
  }

  async messages(me: string, matchId: string, before?: string) {
    await this.assertParticipant(me, matchId);
    const list = await this.prisma.message.findMany({
      where: { matchId, ...(before ? { sentAt: { lt: new Date(before) } } : {}) },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    return list.reverse();
  }

  /** 23. Сообщение. Повтор с тем же clientId возвращает уже сохранённое сообщение. */
  async sendMessage(me: string, matchId: string, clientId: string, text: string) {
    const match = await this.assertParticipant(me, matchId);
    const existing = await this.prisma.message.findUnique({ where: { matchId_clientId: { matchId, clientId } } });
    if (existing && existing.senderId !== me) throw new ConflictException('clientId уже использован другим участником');
    if (!text.trim()) throw new BadRequestException('Сообщение не может быть пустым');
    const message = await this.prisma.message.upsert({
      where: { matchId_clientId: { matchId, clientId } },
      create: { matchId, senderId: me, clientId, text },
      update: {},
    });
    const other = match.userAId === me ? match.userBId : match.userAId;
    if (message.senderId !== me) throw new ConflictException('clientId уже использован другим участником');
    await this.notifications.notify(other, 'Новое сообщение');
    return message;
  }

  /** 24. Предложение встречи. */
  async proposeMeeting(me: string, matchId: string, place: string, meetAt: string) {
    const match = await this.assertParticipant(me, matchId);
    const when = new Date(meetAt);
    if (when <= new Date()) throw new BadRequestException('Время встречи должно быть в будущем');
    const meeting = await this.prisma.meeting.create({ data: { matchId, proposerId: me, place, meetAt: when } });
    const other = match.userAId === me ? match.userBId : match.userAId;
    await this.notifications.notify(other, `Вам предложили встречу: ${place}`);
    return meeting;
  }

  /** 24. Ответ на предложение — только второй участник и только один раз. */
  async answerMeeting(me: string, meetingId: string, status: 'ACCEPTED' | 'DECLINED') {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Встреча не найдена');
    await this.assertParticipant(me, meeting.matchId);
    if (meeting.proposerId === me) throw new ForbiddenException('Ответить должен второй участник');
    if (meeting.status !== 'PROPOSED') throw new ConflictException('На это предложение уже ответили');
    const changed = await this.prisma.meeting.updateMany({ where: { id: meetingId, status: 'PROPOSED' }, data: { status } });
    if (!changed.count) throw new ConflictException('На это предложение уже ответили');
    const updated = await this.prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
    await this.notifications.notify(meeting.proposerId, status === 'ACCEPTED' ? 'Встреча согласована' : 'Встречу отклонили');
    return updated;
  }

  private async hasPremium(userId: string): Promise<boolean> {
    const sub = await this.prisma.subscription.findFirst({
      where: { payment: { userId }, endsAt: { gt: new Date() } },
      select: { id: true },
    });
    return !!sub;
  }
}
