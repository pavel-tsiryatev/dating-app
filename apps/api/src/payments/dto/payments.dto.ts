import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentKind } from '@prisma/client';
import { IsDateString, IsEnum, IsUUID, ValidateIf } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentKind })
  @IsEnum(PaymentKind)
  kind: PaymentKind;

  @ApiPropertyOptional({ format: 'uuid', description: 'Мероприятие. Обязателен для билета' })
  @ValidateIf((o) => o.kind === 'TICKET')
  @IsUUID()
  eventId?: string;
}

export class StatsQueryDto {
  @ApiProperty({ example: '2026-11-01' })
  @IsDateString()
  from: string;

  @ApiProperty({ example: '2026-12-01' })
  @IsDateString()
  to: string;
}
