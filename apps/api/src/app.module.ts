import { ExtensionsModule } from './extensions/extensions.module';
import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from './common/auth/auth.guard';
import { Public } from './common/auth/decorators';
import { PrismaModule } from './common/prisma.service';
import { RedisModule } from './common/redis.module';
import { validateEnv } from './config';
import { EventsModule } from './events/events.module';
import { MailModule } from './mail/mail.service';
import { MatchingModule } from './matching/matching.module';
import { ModerationModule } from './moderation/moderation.module';
import { NotificationsModule } from './notifications/notifications.service';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';

@Controller('health')
class HealthController {
  @Public()
  @Get()
  health() {
    return { ok: true };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: (process.env.JWT_TTL ?? '7d') as `${number}d` },
      }),
    }),
    ScheduleModule.forRoot(),
    // Ограничение частоты запросов с одного IP: 120 в минуту на всё, строже — на выдачу и проверку кода.
    // За прокси (nginx) нужно включить trust proxy, иначе все запросы будут считаться с одного адреса.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      skipIf: () => process.env.THROTTLE_DISABLED === '1',
    }),
    PrismaModule,
    RedisModule,
    MailModule,
    NotificationsModule,
    ExtensionsModule,
    UsersModule, // A1
    MatchingModule, // A2
    ModerationModule, // A3
    EventsModule, // A4
    PaymentsModule, // A5
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
