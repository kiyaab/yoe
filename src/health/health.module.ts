import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [BotModule],
  controllers: [HealthController],
})
export class HealthModule {}
