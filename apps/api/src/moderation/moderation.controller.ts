import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiAuthErrors, ApiErrors } from '../common/api-docs';
import { AuthUser, CurrentUser, Roles } from '../common/auth/decorators';
import { CreateReportDto, DecisionDto } from './dto/report.dto';
import { DecisionResultDto, ReportCreatedDto, ReportDto } from './dto/responses';
import { ModerationService } from './moderation.service';

@ApiTags('A3 · Модерация')
@ApiBearerAuth()
@ApiAuthErrors()
@Controller()
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Post('reports')
  @ApiOperation({
    summary: '31: пожаловаться',
    description: 'Одна жалоба на одного человека. После 3 открытых жалоб от разных людей анкета скрывается из ленты '
      + 'до решения модератора.',
  })
  @ApiCreatedResponse({ type: ReportCreatedDto })
  @ApiErrors({
    400: 'Нельзя пожаловаться на себя',
    404: 'Пользователь не найден',
    409: 'Вы уже жаловались на этого пользователя',
  })
  report(@CurrentUser() user: AuthUser, @Body() dto: CreateReportDto) {
    return this.moderation.report(user.id, dto.targetId, dto.reason);
  }

  @Roles('MODERATOR', 'ADMIN')
  @Get('admin/reports')
  @ApiOperation({ summary: '32: очередь жалоб', description: 'По умолчанию только открытые, старые сверху. Роли: MODERATOR, ADMIN.' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED', 'ALL'] })
  @ApiOkResponse({ type: [ReportDto] })
  @ApiErrors({ 400: 'Неверный статус жалоб' })
  queue(@Query('status') status?: string) {
    return this.moderation.queue(status);
  }

  @Roles('MODERATOR', 'ADMIN')
  @Post('admin/reports/:id/decision')
  @HttpCode(200)
  @ApiOperation({
    summary: '32–33: решение модератора',
    description: 'Закрывает все открытые жалобы на этого человека. BLOCKED блокирует аккаунт; REJECTED и WARNED '
      + 'возвращают скрытую анкету в ленту (заблокированного не разблокируют). Роли: MODERATOR, ADMIN.',
  })
  @ApiOkResponse({ type: DecisionResultDto })
  @ApiErrors({ 404: 'Жалоба не найдена', 409: 'Жалоба уже рассмотрена' })
  decide(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: DecisionDto) {
    return this.moderation.decide(user.id, id, dto.decision);
  }
}
