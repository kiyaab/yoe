import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { WinnerPosition } from '@prisma/client';

export class ExecuteDrawDto {
  @ApiProperty({ description: 'Lottery Round UUID' })
  @IsNotEmpty()
  @IsString()
  roundId: string;

  @ApiProperty({
    enum: WinnerPosition,
    example: WinnerPosition.FIRST_PRIZE,
    description: 'Target prize category to draw for',
  })
  @IsEnum(WinnerPosition)
  position: WinnerPosition;
}
