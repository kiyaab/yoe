import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoundDto {
  @ApiProperty({ example: 25, description: 'Sequential round number' })
  @IsNumber()
  @Min(1)
  roundNumber: number;

  @ApiProperty({ example: 'Ethiopian New Era Draw #025', description: 'Display name for lottery draw' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 100.0, default: 100.0 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  ticketPrice?: number;

  @ApiPropertyOptional({ example: 200, default: 200 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  maxTickets?: number;

  @ApiPropertyOptional({ example: 10000.0, default: 10000.0 })
  @IsOptional()
  @IsNumber()
  firstPrize?: number;

  @ApiPropertyOptional({ example: 1000.0, default: 1000.0 })
  @IsOptional()
  @IsNumber()
  secondPrize?: number;

  @ApiPropertyOptional({ example: 500.0, default: 500.0 })
  @IsOptional()
  @IsNumber()
  thirdPrize?: number;
}
