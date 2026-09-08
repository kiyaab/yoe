import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { BotService } from '../bot/bot.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private botService: BotService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Comprehensive 24/7 system health status' })
  async check(@Res() res: Response) {
    let dbOk = false;
    let dbLatencyMs = 0;
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      dbOk = true;
    } catch (e) {
      dbOk = false;
    }

    const redisOk = await this.redisService.isHealthy();
    const botStatus = this.botService.getStatus();

    const uploadPath =
      process.env.STORAGE_LOCAL_PATH || path.join(process.cwd(), 'uploads', 'receipts');
    const storageOk = fs.existsSync(uploadPath);

    const mem = process.memoryUsage();
    const memUsageMb = {
      rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
    };

    const isHealthy = dbOk && botStatus.connected;
    const httpStatus = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      subsystems: {
        database: {
          status: dbOk ? 'up' : 'down',
          latencyMs: dbLatencyMs,
        },
        redis: {
          status: redisOk ? 'up' : 'fallback_memory',
        },
        telegramBot: {
          status: botStatus.connected ? 'up' : 'down',
          username: botStatus.botUsername,
          mode: botStatus.mode,
          webhookConfigured: !!botStatus.webhookUrl,
        },
        receiptStorage: {
          status: storageOk ? 'up' : 'missing_dir',
          path: uploadPath,
        },
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsageMb: memUsageMb,
        pid: process.pid,
      },
    });
  }
}
