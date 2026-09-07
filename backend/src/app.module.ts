import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as fs from 'fs';
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

const getStaticPath = (): string => {
  const candidates = [
    join(process.cwd(), 'frontend', 'out'),
    join(process.cwd(), '..', 'frontend', 'out'),
    join(process.cwd(), 'out'),
    join(__dirname, '..', '..', 'frontend', 'out'),
    join(__dirname, '..', '..', '..', 'frontend', 'out'),
    join(__dirname, '..', 'client'),
    join(__dirname, '..', 'public'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return join(process.cwd(), 'frontend', 'out');
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ServeStaticModule.forRoot({
      rootPath: getStaticPath(),
      exclude: ['/api/(.*)'],
      serveStaticOptions: {
        fallthrough: true,
      },
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
