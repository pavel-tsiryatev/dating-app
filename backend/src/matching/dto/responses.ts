import { ApiProperty } from '@nestjs/swagger';
import { Goal, MeetingStatus, UserStatus } from '@prisma/client';

export class FeedPhotoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'photos/3f6c…/1.jpg' })
  storageKey: string;
}

export class FeedItemDto {
  @ApiProperty({ format: 'uuid', description: 'Передаётся в POST /likes как toUserId' })
  userId: string;

  @ApiProperty({ example: 'Анна' })
  name: string;

  @ApiProperty({ example: 'УрФУ' })
  university: string;

  @ApiProperty({ example: 'ИЕНиМ' })
  institute: string;

  @ApiProperty({ enum: Goal })
  goal: Goal;

  @ApiProperty({ type: String, nullable: true })
  about: string | null;

  @ApiProperty({ example: 2, description: 'Сколько интересов совпадает с вашими — по этому числу лента отсортирована' })
  common: number;

  @ApiProperty({ type: [FeedPhotoDto] })
  photos: FeedPhotoDto[];

  @ApiProperty({ type: [String], example: ['настолки', 'кино', 'бег'] })
  interests: string[];
}

export class LikeResultDto {
  @ApiProperty({ description: 'true — лайк взаимный, создано совпадение и открыт чат' })
  match: boolean;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, description: 'Id совпадения, если match = true' })
  matchId: string | null;
}

export class MessageDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  matchId: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiProperty({ example: 'c7d1-17', description: 'Id сообщения, присвоенный клиентом' })
  clientId: string;

  @ApiProperty({ example: 'Привет! Тоже любишь настолки?' })
  text: string;

  @ApiProperty({ format: 'date-time' })
  sentAt: Date;
}

export class MatchUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, nullable: true, example: 'Борис' })
  name: string | null;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;
}

export class MatchDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: MatchUserDto, description: 'Собеседник' })
  user: MatchUserDto;

  @ApiProperty({ type: MessageDto, nullable: true })
  lastMessage: MessageDto | null;
}

export class MeetingDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  matchId: string;

  @ApiProperty({ format: 'uuid', description: 'Кто предложил встречу' })
  proposerId: string;

  @ApiProperty({ example: 'Антикафе «Циферблат», Ленина 26' })
  place: string;

  @ApiProperty({ format: 'date-time' })
  meetAt: Date;

  @ApiProperty({ enum: MeetingStatus })
  status: MeetingStatus;
}
