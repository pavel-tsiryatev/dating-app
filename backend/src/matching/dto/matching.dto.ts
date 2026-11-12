import { Goal } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class FeedQueryDto {
  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
  @IsOptional() @IsEnum(Goal) goal?: Goal;
  @IsOptional() @IsString() @Length(2, 80) university?: string;
  @IsOptional() @IsString() @Length(2, 80) institute?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) @Max(100) minAge?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(18) @Max(100) maxAge?: number;

}

export class LikeDto {
  @ApiProperty({ format: 'uuid', description: 'userId анкеты из ленты' })
  @IsUUID()
  toUserId: string;

  @ApiProperty({ description: 'true — лайк, false — пропустить' })
  @IsBoolean()
  isLike: boolean;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Id сообщения на клиенте: повторная отправка не создаст дубль (R2)' })
  @IsString()
  @Length(1, 64)
  clientId: string;

  @ApiProperty()
  @IsString()
  @Length(1, 2000)
  text: string;
}

export class MessagesQueryDto {
  @ApiProperty({ required: false, description: 'Вернуть сообщения старше этой даты (ISO)' })
  @IsOptional()
  @IsDateString()
  before?: string;
}

export class ProposeMeetingDto {
  @ApiProperty({ example: 'Антикафе «Циферблат», Ленина 26' })
  @IsString()
  @Length(3, 200)
  place: string;

  @ApiProperty({ example: '2026-11-20T18:00:00+05:00' })
  @IsDateString()
  meetAt: string;
}

export class AnswerMeetingDto {
  @ApiProperty({ enum: ['ACCEPTED', 'DECLINED'] })
  @IsIn(['ACCEPTED', 'DECLINED'])
  status: 'ACCEPTED' | 'DECLINED';
}
