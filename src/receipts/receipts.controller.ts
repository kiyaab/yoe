import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReceiptsService } from './receipts.service';
import { Response } from 'express';

@ApiTags('receipts')
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a payment receipt (JPG, PNG, WEBP, PDF up to 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string' },
        receipt: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('receipt', {
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async upload(
    @Body('paymentId') paymentId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!paymentId) {
      throw new BadRequestException('paymentId is required');
    }
    return this.receiptsService.saveReceipt(paymentId, file);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'View or stream receipt file' })
  async getReceiptFile(@Param('id') id: string, @Res() res: Response) {
    const { stream, mimeType, fileName } = await this.receiptsService.getReceiptFile(id);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${fileName}"`,
    });
    stream.pipe(res);
  }
}
