import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

/** Блок A2 «Организовать знакомства»: задачи 21–24. */
@Module({ controllers: [MatchingController], providers: [MatchingService] })
export class MatchingModule {}
