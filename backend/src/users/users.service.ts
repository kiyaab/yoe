import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 50, search } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { telegramId: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { tickets: true, payments: true },
          },
        },
      }),
    ]);

    return { total, users };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tickets: {
          include: { round: true, payment: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: { receipt: true, ticket: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: { telegramId: telegramId.toString() },
      include: {
        tickets: {
          include: { round: true, payment: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateUserStatus(id: string, status: UserStatus, adminId: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: status === UserStatus.SUSPENDED ? 'SUSPEND_USER' : 'UNSUSPEND_USER',
        entity: 'User',
        entityId: id,
        metadata: JSON.stringify({ status }),
      },
    });

    return user;
  }
}
