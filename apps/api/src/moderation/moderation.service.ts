import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReportDecision, UserStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { REPORTS_TO_HIDE } from '../common/rules';
import { NotificationsService } from '../notifications/notifications.service';

/** Блок A3 «Обеспечивать безопасность»: задачи 31–33. */
@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  /** 31. Жалоба. При 3 открытых жалобах от разных людей анкета скрывается до решения (правило 6). */
  async report(authorId: string, targetId: string, reason: string) {
    if (authorId === targetId) throw new BadRequestException('Нельзя пожаловаться на себя');
    const target = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!target) throw new NotFoundException('Пользователь не найден');
    try {
      const report = await this.prisma.report.create({ data: { authorId, targetId, reason } });
      const open = await this.prisma.report.count({ where: { targetId, status: 'OPEN' } });
      if (open >= REPORTS_TO_HIDE) {
        await this.prisma.user.updateMany({ where: { id: targetId, status: 'ACTIVE' }, data: { status: 'HIDDEN' } });
      }
      return { id: report.id, status: report.status };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Вы уже жаловались на этого пользователя');
      }
      throw e;
    }
  }

  /** 32. Очередь модератора. Переписку модератор получает только по жалобе. */
  queue() {
    return this.prisma.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'asc' },
      include: { target: { select: { id: true, status: true, profile: { select: { name: true } } } } },
    });
  }

  /** 32–33. Решение закрывает все открытые жалобы на этого человека и меняет его статус. */
  async decide(moderatorId: string, reportId: string, decision: ReportDecision) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Жалоба не найдена');
    if (report.status === 'CLOSED') throw new ConflictException('Жалоба уже рассмотрена');

    const { authors, targetStatus } = await this.prisma.$transaction(async (tx) => {
      const open = await tx.report.findMany({ where: { targetId: report.targetId, status: 'OPEN' } });
      await tx.report.updateMany({
        where: { targetId: report.targetId, status: 'OPEN' },
        data: { status: 'CLOSED', decision, moderatorId },
      });
      const target = await tx.user.findUniqueOrThrow({ where: { id: report.targetId }, select: { status: true } });
      // Отклонение жалобы возвращает в ленту только скрытую анкету.
      // Уже заблокированного пользователя оно не разблокирует.
      const next: UserStatus =
        decision === 'BLOCKED' ? 'BLOCKED' : target.status === 'HIDDEN' ? 'ACTIVE' : target.status;
      if (next !== target.status) {
        await tx.user.update({ where: { id: report.targetId }, data: { status: next } });
      }
      return { authors: open.map((r) => r.authorId), targetStatus: next };
    });

    const text: Record<ReportDecision, string> = {
      REJECTED: 'Жалоба на вас рассмотрена: нарушений не найдено',
      WARNED: 'Модератор вынес вам предупреждение',
      BLOCKED: 'Ваш аккаунт заблокирован модератором',
    };
    await this.notifications.notify(report.targetId, text[decision]);
    await Promise.all(authors.map((a) => this.notifications.notify(a, 'Ваша жалоба рассмотрена')));
    return { targetId: report.targetId, decision, status: targetStatus };
  }
}
