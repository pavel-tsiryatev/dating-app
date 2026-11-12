import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Roles } from '../common/auth/decorators';
import { CreateReportDto, DecisionDto } from './dto/report.dto';
import { ModerationService } from './moderation.service';

@ApiTags('A3 · Модерация')
@ApiBearerAuth()
@Controller()
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Post('reports')
  @ApiOperation({ summary: '31: пожаловаться' })
  report(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.moderation.report(user.id, dto.targetId, dto.reason);
  }

  @Roles('MODERATOR', 'ADMIN')
  @Get('admin/reports')
  @ApiOperation({ summary: '32: очередь жалоб' })
  queue(@Query("status") status?: string) {
    return this.moderation.queue(status);
  }

  @Roles('MODERATOR', 'ADMIN')
  @Post('admin/reports/:id/decision')
  @ApiOperation({ summary: '32–33: решение модератора' })
  decide(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DecisionDto) {
    return this.moderation.decide(user.id, id, dto.decision);
  }
}
