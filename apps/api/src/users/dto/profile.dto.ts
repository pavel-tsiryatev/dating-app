import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Goal } from '@prisma/client';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsOptional, IsString, Length, MaxLength,
} from 'class-validator';
import { MAX_INTERESTS, MIN_INTERESTS } from '../../common/rules';

export class UpsertProfileDto {
  @ApiProperty({ example: 'Иван' })
  @IsString()
  @Length(1, 40)
  name: string;

  @ApiProperty({ example: 'УрФУ' })
  @IsString()
  @Length(2, 80)
  university: string;

  @ApiProperty({ example: 'ИРИТ-РтФ' })
  @IsString()
  @Length(2, 80)
  institute: string;

  @ApiProperty({ enum: Goal })
  @IsEnum(Goal)
  goal: Goal;

  @ApiPropertyOptional({ example: 'Люблю настолки и походы' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  about?: string;

  @ApiProperty({ example: ['настолки', 'походы', 'кино'], description: `${MIN_INTERESTS}–${MAX_INTERESTS} интересов` })
  @IsArray()
  @ArrayMinSize(MIN_INTERESTS, { message: `Нужно хотя бы ${MIN_INTERESTS} интереса` })
  @ArrayMaxSize(MAX_INTERESTS, { message: `Не больше ${MAX_INTERESTS} интересов` })
  @IsString({ each: true })
  @Length(2, 30, { each: true })
  interests: string[];

  @ApiPropertyOptional({ description: 'Скрыть анкету от студентов своего института (правило 5)' })
  @IsOptional()
  @IsBoolean()
  hideFromInstitute?: boolean;
}

export class AddPhotoDto {
  @ApiProperty({ description: 'Ключ файла в объектном хранилище (после загрузки по presigned URL)' })
  @IsString()
  @Length(1, 300)
  storageKey: string;
}
