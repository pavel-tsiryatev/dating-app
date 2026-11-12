import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class PartnerDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Антикафе «Циферблат»' })
  name: string;

  @ApiProperty({ example: 'Екатеринбург, ул. Ленина, 26' })
  address: string;

  @ApiProperty({ type: String, nullable: true, example: 'Скидка 20% для участников' })
  terms: string | null;
}

export class EventDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  partnerId: string;

  @ApiProperty({ example: 'Вечер настолок для первокурсников' })
  title: string;

  @ApiProperty({ format: 'date-time' })
  startsAt: Date;

  @ApiProperty({ example: 30 })
  capacity: number;

  @ApiProperty({ example: 40000, description: 'Цена в копейках' })
  price: number;
}

export class EventPlaceDto {
  @ApiProperty({ example: 'Антикафе «Циферблат»' })
  name: string;

  @ApiProperty({ example: 'Екатеринбург, ул. Ленина, 26' })
  address: string;
}

export class EventListItemDto extends EventDto {
  @ApiProperty({ type: EventPlaceDto })
  partner: EventPlaceDto;

  @ApiProperty({ example: 12, description: 'Свободные места: вместимость минус оплаченные билеты и действующие брони' })
  freeSeats: number;
}

export class TicketDto {
  @ApiProperty({ format: 'uuid' })
  eventId: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, description: 'Платёж, если он уже создан' })
  paymentId: string | null;

  @ApiProperty({ enum: TicketStatus, description: 'RESERVED — бронь, PAID — оплачен, RELEASED — бронь снята' })
  status: TicketStatus;

  @ApiProperty({ format: 'date-time', description: 'До этого времени нужно оплатить (30 минут с момента брони)' })
  reservedUntil: Date;
}

export class MyTicketDto extends TicketDto {
  @ApiProperty({ type: EventDto })
  event: EventDto;
}
