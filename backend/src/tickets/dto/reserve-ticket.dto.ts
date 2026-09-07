import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ReserveTicketDto {
  @ApiProperty({ example: 87, description: 'Chosen lucky number between 1 and 200' })
  @IsNumber()
  @Min(1)
  @Max(200)
  ticketNumber: number;

  @ApiPropertyOptional({ description: 'Round UUID (defaults to active round if omitted)' })
  @IsOptional()
  @IsString()
  roundId?: string;

  @ApiProperty({ example: '123456789', description: 'Telegram User ID of the participant' })
  @IsNotEmpty()
  @IsString()
  telegramId: string;

  @ApiPropertyOptional({ example: 'dawit_eth', description: 'Telegram username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'Dawit', description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: '+251911223344', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;
}
