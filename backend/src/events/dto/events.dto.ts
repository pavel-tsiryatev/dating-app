import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreatePartnerDto {
  @ApiProperty({ example: 'Антикафе «Циферблат»' })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiProperty({ example: 'Екатеринбург, ул. Ленина, 26' })
  @IsString()
  @Length(3, 200)
  address: string;

  @ApiPropertyOptional({ example: 'Скидка 20% для участников' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  terms?: string;
}

export class CreateEventDto {
  @ApiProperty({ format: 'uuid', description: 'Площадка из POST /admin/partners' })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ example: 'Вечер настолок для первокурсников' })
  @IsString()
  @Length(3, 160)
  title: string;

  @ApiProperty({ example: '2026-11-28T19:00:00+05:00' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(1)
  @Max(1000)
  capacity: number;

  @ApiProperty({ example: 40000, description: 'Цена в копейках (400 ₽)' })
  @IsInt()
  @Min(0)
  price: number;
  @IsOptional() @IsString() @Length(2, 40) category?: string;
  @IsOptional() @IsString() @Length(0, 2000) description?: string;
  @IsOptional() @IsString() @Length(0, 300) posterUrl?: string;
  @IsOptional() @IsBoolean() published?: boolean;

}
