import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private memoryLocks = new Map<string, number>();

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn('ℹ REDIS_URL not configured. Operating with in-memory concurrency locks.');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('🔴 Connected to Redis successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error: ${err.message}. Falling back to in-memory locking.`);
      });

      this.client.connect().catch((err) => {
        this.logger.warn(`Initial Redis connection failed: ${err.message}. Safe fallback active.`);
      });
    } catch (err: any) {
      this.logger.warn(`Could not initialize Redis client: ${err.message}`);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const res = await this.client.ping();
      return res === 'PONG';
    } catch (e) {
      return false;
    }
  }

  /**
   * Acquire a distributed lock with TTL
   */
  async acquireLock(key: string, ttlMs: number = 10000): Promise<boolean> {
    const lockKey = `lock:${key}`;
    if (this.client && this.isConnected) {
      try {
        const result = await this.client.set(lockKey, 'locked', 'PX', ttlMs, 'NX');
        return result === 'OK';
      } catch (e) {
        // Fallback to memory lock
      }
    }

    // In-memory fallback
    const now = Date.now();
    const existing = this.memoryLocks.get(lockKey);
    if (existing && existing > now) {
      return false; // Still locked
    }
    this.memoryLocks.set(lockKey, now + ttlMs);
    return true;
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(key: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    if (this.client && this.isConnected) {
      try {
        await this.client.del(lockKey);
        return true;
      } catch (e) {}
    }

    this.memoryLocks.delete(lockKey);
    return true;
  }

  getClient(): Redis | null {
    return this.client;
  }
}
