import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateBufferSha256 } from '../common/utils/file-hash.util';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReceiptsService {
  private readonly uploadDir: string;

  constructor(private prisma: PrismaService) {
    this.uploadDir =
      process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'uploads', 'receipts');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveReceipt(paymentId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No receipt file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPG, PNG, WEBP, and PDF receipts are supported.'
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds the 5MB limit.');
    }

    // Anti-fraud: Calculate cryptographic SHA-256 hash of the receipt buffer
    const hash = calculateBufferSha256(file.buffer);

    // Check for duplicate receipt hash across the entire platform
    const existingReceipt = await this.prisma.receipt.findUnique({
      where: { hash },
      include: {
        payment: {
          include: { ticket: true },
        },
      },
    });

    if (existingReceipt) {
      throw new ConflictException(
        'Duplicate receipt detected. This exact payment receipt was already submitted for another ticket. Anti-fraud security prevented this submission.'
      );
    }

    // Ensure payment exists
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment record ${paymentId} not found`);
    }

    // Determine extension
    const ext = path.extname(file.originalname) || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
    const storageKey = `${hash}${ext}`;
    const targetPath = path.join(this.uploadDir, storageKey);

    // Save file buffer to secure storage
    await fs.promises.writeFile(targetPath, file.buffer);

    // Store in Prisma database
    const receipt = await this.prisma.receipt.upsert({
      where: { paymentId },
      update: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        hash,
        storageKey,
        uploadedAt: new Date(),
      },
      create: {
        paymentId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        hash,
        storageKey,
      },
    });

    return receipt;
  }

  async getReceiptFile(receiptId: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    const filePath = path.join(this.uploadDir, receipt.storageKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Receipt physical file missing from storage');
    }

    return {
      stream: fs.createReadStream(filePath),
      mimeType: receipt.mimeType,
      fileName: receipt.originalName,
      size: receipt.size,
    };
  }
}
