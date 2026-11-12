import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, Matches } from 'class-validator';

export class RequestCodeDto {
  @ApiProperty({ example: 'ivan.petrov@urfu.me' })
  @IsEmail({}, { message: 'Укажите почту' })
  email: string;
}

export class VerifyCodeDto {
  @ApiProperty({ example: 'ivan.petrov@urfu.me' })
  @IsEmail({}, { message: 'Укажите почту' })
  email: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: 'Код — 6 цифр' })
  code: string;

  @ApiPropertyOptional({ example: '2005-04-17', description: 'Обязательна при первом входе (проверка 18+)' })
  @IsOptional()
  @IsDateString({}, { message: 'Дата рождения в формате ГГГГ-ММ-ДД' })
  birthDate?: string;
}
