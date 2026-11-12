import { PrismaService } from '../common/prisma.service';
import { Global, Injectable, Logger, Module } from '@nestjs/common';

/**
 * Уведомления пользователям (совпадение, решение модератора, оплата).
 * Сейчас пишет в лог. Дальше сюда подключаются push (Expo), браузерные уведомления и Telegram-бот —
 * остальной код менять не придётся.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly db: PrismaService) {}
  private readonly log = new Logger('Notifications');

  async notify(userId: string, text: string): Promise<void> {
    const profile = await this.db.profile.findUnique({ where: { userId }, select: { notifications: true } });
    if (profile?.notifications === false) return;
    this.log.log(`→ ${userId}: ${text}`);
  }
}

@Global()
@Module({ providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
