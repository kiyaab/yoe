import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Redis from 'ioredis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
  }

  let redisStatus = 'disabled';
  if (process.env.REDIS_URL) {
    try {
      const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, connectTimeout: 1000 });
      await redis.connect();
      const pong = await redis.ping();
      redisStatus = pong === 'PONG' ? 'connected' : 'error';
      redis.disconnect();
    } catch {
      redisStatus = 'unreachable';
    }
  }

  const mem = process.memoryUsage();

  return NextResponse.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    subsystems: {
      database: { status: dbStatus, latencyMs: dbLatency },
      redis: { status: redisStatus },
      bot: {
        configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        mode: process.env.TELEGRAM_BOT_MODE || 'webhook',
      },
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsageMb: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      },
    },
    latencyMs: Date.now() - startTime,
  });
}
