import { ApiProperty } from '@nestjs/swagger';
import { Goal, UserRole, UserStatus } from '@prisma/client';

export class CodeSentDto {
  @ApiProperty({ example: true })
  sent: boolean;
}

export class TokenDto {
  @ApiProperty({ description: 'JWT. Передаётся в заголовке Authorization: Bearer <токен>. Действует 7 дней' })
  accessToken: string;

  @ApiProperty({ description: 'true — пользователь только что зарегистрирован, нужно заполнить анкету' })
  isNew: boolean;
}

export class PhotoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'photos/3f6c…/1.jpg', description: 'Ключ файла в объектном хранилище' })
  storageKey: string;

  @ApiProperty({ example: 0, description: 'Порядок показа, с нуля' })
  position: number;
}

export class ProfileDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'Иван' })
  name: string;

  @ApiProperty({ example: 'УрФУ' })
  university: string;

  @ApiProperty({ example: 'ИРИТ-РтФ' })
  institute: string;

  @ApiProperty({ enum: Goal })
  goal: Goal;

  @ApiProperty({ type: String, nullable: true, example: 'Люблю настолки и походы' })
  about: string | null;

  @ApiProperty()
  hideFromInstitute: boolean;

  @ApiProperty({ type: [PhotoDto] })
  photos: PhotoDto[];

  @ApiProperty({ type: [String], example: ['настолки', 'походы', 'кино'] })
  interests: string[];
}

export class MeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ivan.petrov@urfu.me' })
  universityEmail: string;

  @ApiProperty({ description: 'Статус студента подтверждён почтой вуза' })
  isVerified: boolean;

  @ApiProperty({ format: 'date-time', example: '2005-04-17T00:00:00.000Z' })
  birthDate: Date;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, description: 'HIDDEN — анкета скрыта из ленты до решения модератора' })
  status: UserStatus;

  @ApiProperty({ type: ProfileDto, nullable: true, description: 'null, пока анкета не заполнена' })
  profile: ProfileDto | null;
}
