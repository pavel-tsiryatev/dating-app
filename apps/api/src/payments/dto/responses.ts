import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentKind, PaymentStatus } from '@prisma/client';

export class PaymentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: PaymentKind })
  kind: PaymentKind;

  @ApiProperty({ example: 40000, description: 'Сумма в копейках' })
  amount: number;

  @ApiProperty({ enum: PaymentStatus, description: 'PENDING — ожидает оплаты, SUCCEEDED — оплачен, FAILED — ошибка' })
  status: PaymentStatus;

  @ApiProperty({ example: '6a1f0c0e-7b3a-4d6e-9d0c-2f8f3f6f1a11' })
  idempotencyKey: string;

  @ApiProperty({
    type: String, nullable: true, example: 'https://pay.example.test/checkout/fake_6a1f…',
    description: 'Куда отправить студента для оплаты. null, если платёж уже не ожидает оплаты',
  })
  confirmationUrl: string | null;
}

export class WebhookResultDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiPropertyOptional({ description: 'true — это уведомление уже было обработано раньше' })
  duplicate?: boolean;

  @ApiPropertyOptional({ description: 'true — платёж с таким id не найден, уведомление пропущено' })
  ignored?: boolean;
}

export class StatsDto {
  @ApiProperty({ format: 'date-time' })
  from: Date;

  @ApiProperty({ format: 'date-time' })
  to: Date;

  @ApiProperty({ example: 120, description: 'Новые регистрации' })
  newUsers: number;

  @ApiProperty({ example: 45, description: 'Созданные совпадения' })
  matches: number;

  @ApiProperty({ example: 9, description: 'Согласованные встречи с датой в периоде' })
  meetingsAccepted: number;

  @ApiProperty({ example: 30, description: 'Оплаченные билеты' })
  ticketsPaid: number;

  @ApiProperty({ example: 4, description: 'Покупки Premium' })
  premiumBought: number;

  @ApiProperty({ example: 1339600, description: 'Выручка в копейках' })
  revenueKopecks: number;
}
