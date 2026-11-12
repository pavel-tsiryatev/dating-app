import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

/** Блок A3 «Обеспечивать безопасность»: задачи 31–33. */
@Module({ controllers: [ModerationController], providers: [ModerationService] })
export class ModerationModule {}
