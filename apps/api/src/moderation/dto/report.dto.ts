import { ApiProperty } from '@nestjs/swagger';
import { ReportDecision } from '@prisma/client';
import { IsEnum, IsString, IsUUID, Length } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ format: 'uuid', description: 'На кого жалоба' })
  @IsUUID()
  targetId: string;

  @ApiProperty({ example: 'Оскорбления в переписке' })
  @IsString()
  @Length(3, 500)
  reason: string;
}

export class DecisionDto {
  @ApiProperty({ enum: ReportDecision })
  @IsEnum(ReportDecision)
  decision: ReportDecision;
}
