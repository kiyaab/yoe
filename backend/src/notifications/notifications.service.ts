import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationStatus } from '@prisma/client';
import { EventsGateway } from './events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway
  ) {}

  async createNotification(params: {
    userId?: string;
    telegramId?: string;
    title: string;
    message: string;
    type: string;
  }) {
    return this.prisma.notification.create({
      data: {
        ...params,
        status: NotificationStatus.PENDING,
      },
    });
  }

  async getPendingTelegramNotifications() {
    return this.prisma.notification.findMany({
      where: {
        status: NotificationStatus.PENDING,
        telegramId: { not: null },
      },
      take: 20,
    });
  }

  async markSent(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  async markFailed(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.FAILED,
      },
    });
  }

  getGateway(): EventsGateway {
    return this.eventsGateway;
  }
}
