import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethodCode } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getPublicPaymentMethods() {
    return this.prisma.paymentMethod.findMany({
      where: { isActive: true },
      select: {
        code: true,
        accountName: true,
        accountNumber: true,
        instructions: true,
      },
    });
  }

  async getAllPaymentMethods() {
    return this.prisma.paymentMethod.findMany();
  }

  async updatePaymentMethod(
    code: PaymentMethodCode,
    data: { accountName?: string; accountNumber?: string; instructions?: string; isActive?: boolean },
    adminId: string
  ) {
    const updated = await this.prisma.paymentMethod.update({
      where: { code },
      data,
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE_PAYMENT_METHOD',
        entity: 'PaymentMethod',
        entityId: updated.id,
        metadata: JSON.stringify({ code, ...data }),
      },
    });

    return updated;
  }

  async getSystemSettings() {
    return this.prisma.systemSetting.findMany();
  }

  async updateSystemSetting(key: string, value: string, adminId: string) {
    const updated = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, updatedAt: new Date() },
      create: { key, value },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE_SYSTEM_SETTING',
        entity: 'SystemSetting',
        entityId: updated.id,
        metadata: JSON.stringify({ key, value }),
      },
    });

    return updated;
  }
}
