import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UserRegisterDto {
  @ApiProperty({ example: '0911223344', description: 'Ethiopian mobile phone number (Telebirr/CBE)' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Abebe', description: 'User first name' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Bikila', description: 'User last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Account password (minimum 6 characters)' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '@abebe_yalfal', description: 'Optional Telegram username handle' })
  @IsOptional()
  @IsString()
  telegramUsername?: string;
}
