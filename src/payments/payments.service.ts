import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentStatus,
  PaymentMethodCode,
  TicketStatus,
  RoundStatus,
  NotificationStatus,
} from '@prisma/client';
import { CreatePaymentDto, ReviewPaymentDto } from './dto/create-payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createPayment(dto: CreatePaymentDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: dto.ticketId },
      include: { round: true, payment: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === TicketStatus.CONFIRMED) {
      throw new BadRequestException('This ticket has already been paid and confirmed.');
    }

    if (ticket.status === TicketStatus.AVAILABLE || !ticket.userId) {
      throw new BadRequestException('Ticket must be reserved by a user before submitting payment.');
    }

    // Generate unique reference if not provided
    const reference =
      dto.reference?.trim() ||
      `PAY-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Upsert payment record for this ticket
    const payment = await this.prisma.payment.upsert({
      where: { ticketId: ticket.id },
      update: {
        method: dto.method,
        reference,
        amount: dto.amount || ticket.round.ticketPrice,
        status: PaymentStatus.PENDING,
        rejectionReason: null,
      },
      create: {
        ticketId: ticket.id,
        userId: ticket.userId,
        method: dto.method,
        reference,
        amount: dto.amount || ticket.round.ticketPrice,
        status: PaymentStatus.PENDING,
      },
      include: {
        ticket: { include: { round: true } },
        user: true,
      },
    });

    return payment;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    status?: PaymentStatus;
    method?: PaymentMethodCode;
    search?: string;
  }) {
    const { skip = 0, take = 50, status, method, search } = params;
    const where: any = {};

    if (status) where.status = status;
    if (method) where.method = method;

    if (search) {
      const searchNum = parseInt(search, 10);
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { user: { telegramId: { contains: search } } },
        ...(isNaN(searchNum) ? [] : [{ ticket: { ticketNumber: searchNum } }]),
      ];
    }

    const [total, payments] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          ticket: { include: { round: true } },
          user: true,
          receipt: true,
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return { total, payments };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        ticket: { include: { round: true } },
        user: true,
        receipt: true,
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async reviewPayment(id: string, dto: ReviewPaymentDto, adminId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        ticket: { include: { round: true } },
        user: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (dto.status === PaymentStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('A reason is required when rejecting a payment receipt.');
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      if (dto.status === PaymentStatus.APPROVED) {
        // 1. Approve Payment
        const updatedPayment = await tx.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.APPROVED,
            reviewedById: adminId,
            reviewedAt: now,
            rejectionReason: null,
          },
          include: { ticket: true, user: true },
        });

        // 2. Confirm Ticket
        await tx.ticket.update({
          where: { id: payment.ticketId },
          data: {
            status: TicketStatus.CONFIRMED,
            confirmedAt: now,
          },
        });

        // 3. Check if Round is now Full
        const confirmedCount = await tx.ticket.count({
          where: {
            roundId: payment.ticket.roundId,
            status: TicketStatus.CONFIRMED,
          },
        });

        if (confirmedCount >= payment.ticket.round.maxTickets) {
          await tx.lotteryRound.update({
            where: { id: payment.ticket.roundId },
            data: { status: RoundStatus.FULL },
          });
        }

        // 4. Create Notification
        await tx.notification.create({
          data: {
            userId: payment.userId,
            telegramId: payment.user.telegramId,
            title: '🎉 Payment Approved!',
            message: `Your payment of ${payment.amount} ETB for Ticket #${String(
              payment.ticket.ticketNumber
            ).padStart(3, '0')} has been approved! You are officially in Draw #${payment.ticket.round.roundNumber}.`,
            type: 'PAYMENT_APPROVED',
            status: NotificationStatus.PENDING,
          },
        });

        // 5. Audit Log
        await tx.auditLog.create({
          data: {
            adminId,
            action: 'APPROVE_PAYMENT',
            entity: 'Payment',
            entityId: id,
            metadata: JSON.stringify({
              ticketNumber: payment.ticket.ticketNumber,
              amount: payment.amount,
              reference: payment.reference,
            }),
          },
        });

        return updatedPayment;
      } else {
        // REJECTED Flow
        const updatedPayment = await tx.payment.update({
          where: { id },
          data: {
            status: PaymentStatus.REJECTED,
            rejectionReason: dto.rejectionReason,
            reviewedById: adminId,
            reviewedAt: now,
          },
          include: { ticket: true, user: true },
        });

        // Release Ticket back to AVAILABLE so other participants can take it
        await tx.ticket.update({
          where: { id: payment.ticketId },
          data: {
            status: TicketStatus.AVAILABLE,
            userId: null,
            reservedAt: null,
          },
        });

        // Create Notification
        await tx.notification.create({
          data: {
            userId: payment.userId,
            telegramId: payment.user.telegramId,
            title: '❌ Payment Verification Failed',
            message: `Your payment for Ticket #${String(payment.ticket.ticketNumber).padStart(
              3,
              '0'
            )} was rejected. Reason: ${dto.rejectionReason}. The ticket has been released.`,
            type: 'PAYMENT_REJECTED',
            status: NotificationStatus.PENDING,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            adminId,
            action: 'REJECT_PAYMENT',
            entity: 'Payment',
            entityId: id,
            metadata: JSON.stringify({
              ticketNumber: payment.ticket.ticketNumber,
              reason: dto.rejectionReason,
            }),
          },
        });

        return updatedPayment;
      }
    });
  }

  async getDashboardStats() {
    const [
      totalRevenueRaw,
      ticketsSold,
      pendingPayments,
      approvedPayments,
      totalUsers,
      activeRound,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.APPROVED },
        _sum: { amount: true },
      }),
      this.prisma.ticket.count({
        where: { status: TicketStatus.CONFIRMED },
      }),
      this.prisma.payment.count({
        where: { status: PaymentStatus.PENDING },
      }),
      this.prisma.payment.count({
        where: { status: PaymentStatus.APPROVED },
      }),
      this.prisma.user.count(),
      this.prisma.lotteryRound.findFirst({
        where: {
          status: { in: [RoundStatus.OPEN, RoundStatus.FULL, RoundStatus.DRAWING] },
        },
        orderBy: { roundNumber: 'desc' },
      }),
    ]);

    const totalRevenue = totalRevenueRaw._sum.amount || 0;
    const availableNumbers = activeRound
      ? await this.prisma.ticket.count({
          where: { roundId: activeRound.id, status: TicketStatus.AVAILABLE },
        })
      : 0;

    return {
      totalRevenue,
      ticketsSold,
      pendingPayments,
      approvedPayments,
      totalUsers,
      currentRound: activeRound?.roundNumber || null,
      currentRoundId: activeRound?.id || null,
      availableNumbers,
    };
  }
}
