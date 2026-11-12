import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/auth/decorators';
import { CreateEventDto, CreatePartnerDto } from './dto/events.dto';
import { EventsService } from './events.service';

@ApiTags('A4 · Мероприятия')
@ApiBearerAuth()
@Controller()
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get('events')
  @ApiOperation({ summary: 'Афиша' })
  upcoming() {
    return this.events.upcoming();
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Мои билеты и брони' })
  myTickets(@CurrentUser() user: AuthUser) {
    return this.events.myTickets(user.id);
  }

  @Post('events/:id/tickets')
  @ApiOperation({ summary: '43: забронировать место на 30 минут' })
  reserve(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.events.reserve(user.id, id);
  }

  @Roles('ADMIN')
  @Post('admin/partners')
  @ApiOperation({ summary: '41: добавить партнёра' })
  createPartner(@Body() dto: CreatePartnerDto) {
    return this.events.createPartner(dto);
  }

  @Roles('ADMIN')
  @Post('admin/events')
  @ApiOperation({ summary: '42: опубликовать мероприятие' })
  createEvent(@Body() dto: CreateEventDto) {
    return this.events.createEvent(dto);
  }
}
