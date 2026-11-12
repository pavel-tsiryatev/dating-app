import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

/** Блок A4 «Проводить мероприятия»: задачи 41–43. */
@Module({ controllers: [EventsController], providers: [EventsService] })
export class EventsModule {}
