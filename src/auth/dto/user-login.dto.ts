import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserLoginDto {
  @ApiProperty({ example: '0911223344', description: 'Registered phone number or Telegram username' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Account password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
