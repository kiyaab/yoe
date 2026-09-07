import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@yalfal.et', description: 'Registered admin email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'AdminPassword2026!', description: 'Admin account password' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
