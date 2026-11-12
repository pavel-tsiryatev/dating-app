import { Body, Controller, Get, Headers, HttpCode, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Public, Roles } from '../common/auth/decorators';
import { CreatePaymentDto, StatsQueryDto } from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('A5 · Оплата и отчёты')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @Post('payments')
  @ApiOperation({ summary: '51: создать платёж за билет или Premium' })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Повтор с тем же ключом вернёт тот же платёж' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto, @Headers('idempotency-key') key?: string) {
    return this.payments.create(user.id, dto.kind, dto.eventId, key);
  }

  @Public()
  @Post('payments/webhook')
  @HttpCode(200)
  @ApiOperation({ summary: '52: уведомление платёжного сервиса (проверка оплаты)' })
  webhook(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: unknown) {
    return this.payments.handleWebhook(headers, body);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get('admin/stats')
  @ApiOperation({ summary: '53: отчёт за период' })
  stats(@Query() q: StatsQueryDto) {
    return this.payments.stats(new Date(q.from), new Date(q.to));
  }
}
