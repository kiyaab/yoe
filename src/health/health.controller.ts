import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Platform health status' })
  async check() {
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (e) {
      dbOk = false;
    }

    const uploadPath =
      process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'uploads', 'receipts');
    const storageOk = fs.existsSync(uploadPath);

    return {
      status: dbOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbOk ? 'up' : 'down',
        storage: storageOk ? 'up' : 'down',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }
}
