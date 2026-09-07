import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus, RoundStatus } from '@prisma/client';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async getTicketsForRound(roundId?: string, userTelegramId?: string) {
    let targetRoundId = roundId;

    if (!targetRoundId) {
      const activeRound = await this.prisma.lotteryRound.findFirst({
        where: {
          status: { in: [RoundStatus.OPEN, RoundStatus.FULL, RoundStatus.DRAWING] },
        },
        orderBy: { roundNumber: 'desc' },
      });
      if (!activeRound) {
        throw new NotFoundException('No active lottery round found');
      }
      targetRoundId = activeRound.id;
    }

    const round = await this.prisma.lotteryRound.findUnique({
      where: { id: targetRoundId },
      include: {
        tickets: {
          orderBy: { ticketNumber: 'asc' },
          include: {
            user: {
              select: { id: true, telegramId: true, username: true, firstName: true },
            },
            payment: {
              select: { id: true, status: true, reference: true },
            },
          },
        },
      },
    });

    if (!round) {
      throw new NotFoundException(`Round ${targetRoundId} not found`);
    }

    // Format each ticket with state relative to current user
    const tickets = round.tickets.map((t) => {
      const isMine = userTelegramId && t.user && t.user.telegramId === userTelegramId.toString();
      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        status: t.status,
        isMine: !!isMine,
        reservedAt: t.reservedAt,
        confirmedAt: t.confirmedAt,
        paymentStatus: t.payment ? t.payment.status : null,
        paymentId: t.payment ? t.payment.id : null,
      };
    });

    return {
      round: {
        id: round.id,
        roundNumber: round.roundNumber,
        name: round.name,
        ticketPrice: round.ticketPrice,
        maxTickets: round.maxTickets,
        firstPrize: round.firstPrize,
        secondPrize: round.secondPrize,
        thirdPrize: round.thirdPrize,
        status: round.status,
      },
      tickets,
    };
  }

  async reserveTicket(dto: ReserveTicketDto) {
    let roundId = dto.roundId;

    if (!roundId) {
      const activeRound = await this.prisma.lotteryRound.findFirst({
        where: { status: RoundStatus.OPEN },
        orderBy: { roundNumber: 'desc' },
      });
      if (!activeRound) {
        throw new BadRequestException('Ticket registration is currently closed or no active round.');
      }
      roundId = activeRound.id;
    }

    // Ensure round is OPEN
    const round = await this.prisma.lotteryRound.findUnique({
      where: { id: roundId },
    });

    if (!round || round.status !== RoundStatus.OPEN) {
      throw new BadRequestException('This round is not currently accepting entries.');
    }

    // Execute atomic reservation in transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Get or create user
      let user = await tx.user.findUnique({
        where: { telegramId: dto.telegramId.toString() },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            telegramId: dto.telegramId.toString(),
            username: dto.username || null,
            firstName: dto.firstName || null,
            phone: dto.phone || null,
          },
        });
      }

      // 2. Concurrency-safe atomic check and update
      // Only updates if status is AVAILABLE
      const updateResult = await tx.ticket.updateMany({
        where: {
          roundId,
          ticketNumber: dto.ticketNumber,
          status: TicketStatus.AVAILABLE,
        },
        data: {
          status: TicketStatus.RESERVED,
          userId: user.id,
          reservedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        // Ticket is already taken!
        throw new ConflictException(
          `⚠️ Number #${String(dto.ticketNumber).padStart(3, '0')} is no longer available. It has just been taken by another participant.`
        );
      }

      // Fetch the reserved ticket
      const reservedTicket = await tx.ticket.findUnique({
        where: {
          roundId_ticketNumber: {
            roundId,
            ticketNumber: dto.ticketNumber,
          },
        },
        include: {
          round: true,
          user: true,
        },
      });

      return {
        success: true,
        message: `Number #${String(dto.ticketNumber).padStart(3, '0')} successfully reserved. Proceed to payment.`,
        ticket: reservedTicket,
      };
    });
  }

  async getMyTickets(telegramId: string) {
    const user = await this.prisma.user.findUnique({
      where: { telegramId: telegramId.toString() },
    });

    if (!user) {
      return [];
    }

    return this.prisma.ticket.findMany({
      where: { userId: user.id },
      include: {
        round: true,
        payment: {
          include: { receipt: true },
        },
        winner: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
