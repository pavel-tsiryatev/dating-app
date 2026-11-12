import { ApiProperty } from '@nestjs/swagger';
import { ReportDecision, ReportStatus, UserStatus } from '@prisma/client';

export class ReportCreatedDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ReportStatus })
  status: ReportStatus;
}

export class ReportTargetProfileDto {
  @ApiProperty({ example: 'Борис' })
  name: string;
}

export class ReportTargetDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ type: ReportTargetProfileDto, nullable: true })
  profile: ReportTargetProfileDto | null;
}

export class ReportDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  authorId: string;

  @ApiProperty({ format: 'uuid' })
  targetId: string;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  moderatorId: string | null;

  @ApiProperty({ example: 'Оскорбления в переписке' })
  reason: string;

  @ApiProperty({ enum: ReportStatus })
  status: ReportStatus;

  @ApiProperty({ enum: ReportDecision, nullable: true })
  decision: ReportDecision | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: ReportTargetDto, description: 'На кого пожаловались' })
  target: ReportTargetDto;
}

export class DecisionResultDto {
  @ApiProperty({ format: 'uuid' })
  targetId: string;

  @ApiProperty({ enum: ReportDecision })
  decision: ReportDecision;

  @ApiProperty({ enum: UserStatus, description: 'Статус пользователя после решения' })
  status: UserStatus;
}
