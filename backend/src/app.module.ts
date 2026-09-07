import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LotteryModule } from './lottery/lottery.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { DrawsModule } from './draws/draws.module';
import { WinnersModule } from './winners/winners.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TelegramModule } from './telegram/telegram.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LotteryModule,
    TicketsModule,
    PaymentsModule,
    ReceiptsModule,
    DrawsModule,
    WinnersModule,
    SettingsModule,
    AuditModule,
    NotificationsModule,
    TelegramModule,
    HealthModule,
  ],
})
export class AppModule {}
