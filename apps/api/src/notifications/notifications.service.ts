import { Global, Injectable, Logger, Module } from '@nestjs/common';

/**
 * Уведомления пользователям (совпадение, решение модератора, оплата).
 * Сейчас пишет в лог. Дальше сюда подключаются push (Expo), браузерные уведомления и Telegram-бот —
 * остальной код менять не придётся.
 */
@Injectable()
export class NotificationsService {
  private readonly log = new Logger('Notifications');

  async notify(userId: string, text: string): Promise<void> {
    this.log.log(`→ ${userId}: ${text}`);
  }
}

@Global()
@Module({ providers: [NotificationsService], exports: [NotificationsService] })
export class NotificationsModule {}
