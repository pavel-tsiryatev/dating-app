import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Goal } from '@prisma/client';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsIn, IsOptional, IsString, Length, Matches, MaxLength,
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
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsBoolean() notifications?: boolean;
  @IsOptional() @IsIn(['light', 'dark']) theme?: string;

}

export class AddPhotoDto {
  @ApiProperty({
    description: 'Ключ файла в объектном хранилище (после загрузки по presigned URL). Только путь, не внешний URL',
    example: 'photos/2f8f3f6f.jpg',
  })
  @IsString()
  @Length(1, 300)
  // Внешние адреса запрещены: иначе в чужую ленту попадёт картинка с любого сервера (трекинг IP, обход проверки файла)
  @Matches(/^(?!.*\.\.)(?!\/\/)[A-Za-z0-9/_.-]+$/, { message: 'storageKey должен быть ключом хранилища, а не URL' })
  storageKey: string;
}
