import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RoundStatus } from '@prisma/client';

export class UpdateRoundDto {
  @ApiPropertyOptional({ example: 'Updated Draw Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: RoundStatus })
  @IsOptional()
  @IsEnum(RoundStatus)
  status?: RoundStatus;
}
