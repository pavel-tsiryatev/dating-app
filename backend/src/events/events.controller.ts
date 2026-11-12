import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuthErrors, ApiErrors } from '../common/api-docs';
import { AuthUser, CurrentUser, Roles } from '../common/auth/decorators';
import { CreateEventDto, CreatePartnerDto } from './dto/events.dto';
import { EventDto, EventListItemDto, MyTicketDto, PartnerDto, TicketDto } from './dto/responses';
import { EventsService } from './events.service';

@ApiTags('A4 · Мероприятия')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get('events')
  @ApiOperation({ summary: 'Афиша', description: 'Будущие мероприятия, ближайшие сверху, с числом свободных мест.' })
  @ApiOkResponse({ type: [EventListItemDto] })
  upcoming() {
    return this.events.upcoming();
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Мои билеты и брони' })
  @ApiOkResponse({ type: [MyTicketDto] })
  myTickets(@CurrentUser() user: AuthUser) {
    return this.events.myTickets(user.id);
  }

  @Post('events/:id/tickets')
  @ApiOperation({
    summary: '43: забронировать место на 30 минут',
    description: 'Дальше нужно создать платёж (POST /payments). Повторный запрос при действующей брони '
      + 'возвращает её же. Если бронь истекла, запрос создаёт новую.',
  })
  @ApiCreatedResponse({ type: TicketDto })
  @ApiErrors({
    400: 'Мероприятие уже прошло',
    404: 'Мероприятие не найдено',
    409: 'Мест нет, либо вы уже записаны (билет оплачен)',
  })
  reserve(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.events.reserve(user.id, id);
  }

  @Roles('ADMIN')
  @Post('admin/partners')
  @ApiOperation({ summary: '41: добавить партнёра', description: 'Роль: ADMIN.' })
  @ApiCreatedResponse({ type: PartnerDto })
  createPartner(@Body() dto: CreatePartnerDto) {
    return this.events.createPartner(dto);
  }

  @Roles('ADMIN')
  @Post('admin/events')
  @ApiOperation({ summary: '42: опубликовать мероприятие', description: 'Роль: ADMIN.' })
  @ApiCreatedResponse({ type: EventDto })
  @ApiErrors({ 400: 'Дата в прошлом или ошибка в полях' })
  createEvent(@Body() dto: CreateEventDto) {
    return this.events.createEvent(dto);
  }
}
