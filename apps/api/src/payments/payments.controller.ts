import { Body, Controller, Get, Headers, HttpCode, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { ApiAuthErrors, ApiErrors } from '../common/api-docs';
import { AuthUser, CurrentUser, Public, Roles } from '../common/auth/decorators';
import { CreatePaymentDto, StatsQueryDto } from './dto/payments.dto';
import { PaymentDto, StatsDto, WebhookResultDto } from './dto/responses';
import { PaymentsService } from './payments.service';

@ApiTags('A5 · Оплата и отчёты')
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @Post('payments')
  @ApiOperation({
    summary: '51: создать платёж за билет или Premium',
    description: 'Для билета сначала нужна бронь (POST /events/{id}/tickets). Ответ содержит confirmationUrl — '
      + 'ссылку на оплату. Повторный запрос для той же брони или с тем же Idempotency-Key возвращает тот же платёж. '
      + 'Билет и Premium активируются не этим запросом, а уведомлением платёжного сервиса.',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: false, description: 'Повтор с тем же ключом вернёт тот же платёж' })
  @ApiCreatedResponse({ type: PaymentDto })
  @ApiErrors({
    400: 'Для билета не указан eventId',
    409: 'Нет действующей брони, либо ключ идемпотентности занят другим пользователем',
  })
  @ApiAuthErrors()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto, @Headers('idempotency-key') key?: string) {
    return this.payments.create(user.id, dto.kind, dto.eventId, key);
  }

  @Public()
  @Post('payments/webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: '52: уведомление платёжного сервиса (проверка оплаты)',
    description: 'Вызывает платёжный сервис, а не клиент. В тестовом режиме подлинность проверяется заголовком '
      + 'X-Webhook-Secret. Повторное уведомление ничего не меняет.',
  })
  @ApiHeader({ name: 'X-Webhook-Secret', required: true, description: 'Значение PAYMENT_WEBHOOK_SECRET' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['providerPaymentId', 'status'],
      properties: {
        providerPaymentId: { type: 'string', example: 'fake_6a1f0c0e-7b3a-4d6e-9d0c-2f8f3f6f1a11' },
        status: { type: 'string', enum: ['succeeded', 'canceled'] },
      },
    },
  })
  @ApiOkResponse({ type: WebhookResultDto })
  @ApiErrors({ 401: 'Неверный секрет или формат уведомления' })
  webhook(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: unknown) {
    return this.payments.handleWebhook(headers, body);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Get('admin/stats')
  @ApiOperation({ summary: '53: отчёт за период', description: 'Обезличенные числа за период [from, to). Роль: ADMIN.' })
  @ApiOkResponse({ type: StatsDto })
  @ApiErrors({ 400: 'from и to должны быть датами' })
  @ApiAuthErrors()
  stats(@Query() q: StatsQueryDto) {
    return this.payments.stats(new Date(q.from), new Date(q.to));
  }
}
