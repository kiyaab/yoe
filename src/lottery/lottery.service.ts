import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoundStatus, TicketStatus } from '@prisma/client';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';

@Injectable()
export class LotteryService {
  constructor(private prisma: PrismaService) {}

  async getCurrentRound() {
    // Return the currently active round (OPEN, FULL, or DRAWING)
    const round = await this.prisma.lotteryRound.findFirst({
      where: {
        status: { in: [RoundStatus.OPEN, RoundStatus.FULL, RoundStatus.DRAWING] },
      },
      orderBy: { roundNumber: 'desc' },
      include: {
        winners: {
          include: { ticket: true },
        },
      },
    });

    if (!round) {
      // Fallback to latest round
      return this.getLatestRound();
    }

    return this.enrichRoundWithStats(round);
  }

  async getLatestRound() {
    const round = await this.prisma.lotteryRound.findFirst({
      orderBy: { roundNumber: 'desc' },
      include: {
        winners: {
          include: { ticket: true },
        },
      },
    });

    if (!round) {
      throw new NotFoundException('No lottery rounds found in system');
    }

    return this.enrichRoundWithStats(round);
  }

  async findOne(id: string) {
    const round = await this.prisma.lotteryRound.findUnique({
      where: { id },
      include: {
        winners: {
          include: { ticket: true },
        },
      },
    });

    if (!round) {
      throw new NotFoundException(`Round with ID ${id} not found`);
    }

    return this.enrichRoundWithStats(round);
  }

  async findAll(status?: RoundStatus) {
    const rounds = await this.prisma.lotteryRound.findMany({
      where: status ? { status } : undefined,
      orderBy: { roundNumber: 'desc' },
      include: {
        winners: {
          include: { ticket: true },
        },
      },
    });

    return Promise.all(rounds.map((r) => this.enrichRoundWithStats(r)));
  }

  async create(dto: CreateRoundDto, adminId: string) {
    const existing = await this.prisma.lotteryRound.findUnique({
      where: { roundNumber: dto.roundNumber },
    });

    if (existing) {
      throw new ConflictException(`Round #${dto.roundNumber} already exists`);
    }

    const maxTickets = dto.maxTickets || 200;

    const round = await this.prisma.$transaction(async (tx) => {
      const created = await tx.lotteryRound.create({
        data: {
          roundNumber: dto.roundNumber,
          name: dto.name,
          ticketPrice: dto.ticketPrice || 100.0,
          maxTickets,
          firstPrize: dto.firstPrize || 10000.0,
          secondPrize: dto.secondPrize || 1000.0,
          thirdPrize: dto.thirdPrize || 500.0,
          status: RoundStatus.OPEN,
          startDate: new Date(),
        },
      });

      // Generate all 200 tickets (1 to maxTickets)
      const tickets = [];
      for (let i = 1; i <= maxTickets; i++) {
        tickets.push({
          roundId: created.id,
          ticketNumber: i,
          status: TicketStatus.AVAILABLE,
        });
      }

      await tx.ticket.createMany({ data: tickets });

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'CREATE_ROUND',
          entity: 'LotteryRound',
          entityId: created.id,
          metadata: JSON.stringify({ roundNumber: created.roundNumber, name: created.name }),
        },
      });

      return created;
    });

    return this.enrichRoundWithStats(round);
  }

  async updateStatus(id: string, newStatus: RoundStatus, adminId: string) {
    const round = await this.prisma.lotteryRound.findUnique({ where: { id } });
    if (!round) {
      throw new NotFoundException(`Round with ID ${id} not found`);
    }

    // State machine validations
    if (round.status === RoundStatus.COMPLETED && newStatus !== RoundStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify status of an already completed draw');
    }

    const updated = await this.prisma.lotteryRound.update({
      where: { id },
      data: { status: newStatus },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE_ROUND_STATUS',
        entity: 'LotteryRound',
        entityId: id,
        metadata: JSON.stringify({ previous: round.status, current: newStatus }),
      },
    });

    return this.enrichRoundWithStats(updated);
  }

  private async enrichRoundWithStats(round: any) {
    const [confirmedCount, reservedCount, availableCount] = await Promise.all([
      this.prisma.ticket.count({
        where: { roundId: round.id, status: TicketStatus.CONFIRMED },
      }),
      this.prisma.ticket.count({
        where: { roundId: round.id, status: TicketStatus.RESERVED },
      }),
      this.prisma.ticket.count({
        where: { roundId: round.id, status: TicketStatus.AVAILABLE },
      }),
    ]);

    const soldCount = confirmedCount;
    const remainingCount = round.maxTickets - soldCount;
    const currentRevenue = confirmedCount * round.ticketPrice;
    const progressPercent = Math.min(100, Math.round((soldCount / round.maxTickets) * 100));

    return {
      ...round,
      stats: {
        soldCount,
        confirmedCount,
        reservedCount,
        availableCount,
        remainingCount,
        currentRevenue,
        maxRevenue: round.maxTickets * round.ticketPrice,
        progressPercent,
        isFull: soldCount >= round.maxTickets,
      },
    };
  }
}
