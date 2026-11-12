import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MatchingModule } from '../matching/matching.module';
import { PaymentsModule } from '../payments/payments.module';
import { ExtensionsController } from './extensions.controller';
@Module({ imports: [UsersModule, MatchingModule, PaymentsModule], controllers: [ExtensionsController] })
export class ExtensionsModule {}
