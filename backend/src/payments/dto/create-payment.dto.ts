import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethodCode, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Reserved ticket UUID' })
  @IsNotEmpty()
  @IsString()
  ticketId: string;

  @ApiProperty({ enum: PaymentMethodCode, example: PaymentMethodCode.TELEBIRR })
  @IsEnum(PaymentMethodCode)
  method: PaymentMethodCode;

  @ApiPropertyOptional({ example: 'TXN-TB-9823412', description: 'Transaction / transfer reference ID from bank / Telebirr SMS' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 100.0, default: 100.0 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}

export class ReviewPaymentDto {
  @ApiProperty({ enum: [PaymentStatus.APPROVED, PaymentStatus.REJECTED], example: PaymentStatus.APPROVED })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiPropertyOptional({ example: 'Receipt could not be verified or amount does not match', description: 'Required if rejecting' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
