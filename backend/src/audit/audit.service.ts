import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { skip?: number; take?: number; action?: string }) {
    const { skip = 0, take = 50, action } = params;
    const where: any = {};
    if (action) where.action = action;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
    ]);

    return { total, logs };
  }
}
