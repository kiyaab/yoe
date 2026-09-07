import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WinnersService {
  constructor(private prisma: PrismaService) {}

  async getPublicWinners() {
    // Find all completed or drawing rounds with winners
    const rounds = await this.prisma.lotteryRound.findMany({
      where: {
        winners: { some: {} },
      },
      orderBy: { roundNumber: 'desc' },
      include: {
        winners: {
          orderBy: { createdAt: 'asc' },
          include: {
            ticket: {
              include: {
                user: {
                  select: { username: true, firstName: true },
                },
              },
            },
          },
        },
      },
    });

    return rounds.map((round) => ({
      id: round.id,
      roundNumber: round.roundNumber,
      name: round.name,
      drawnAt: round.drawnAt,
      status: round.status,
      firstPrize: round.firstPrize,
      secondPrize: round.secondPrize,
      thirdPrize: round.thirdPrize,
      winners: round.winners.map((w) => ({
        id: w.id,
        position: w.position,
        prizeAmount: w.prizeAmount,
        ticketNumber: w.ticket.ticketNumber,
        winnerDisplay:
          w.ticket.user?.username ? `@${w.ticket.user.username}` : w.ticket.user?.firstName || 'Anonymous Winner',
        drawnAt: w.createdAt,
      })),
    }));
  }

  async getLatestWinners() {
    const latestRoundWithWinners = await this.prisma.lotteryRound.findFirst({
      where: { winners: { some: {} } },
      orderBy: { roundNumber: 'desc' },
      include: {
        winners: {
          include: {
            ticket: {
              include: {
                user: { select: { username: true, firstName: true } },
              },
            },
          },
        },
      },
    });

    if (!latestRoundWithWinners) {
      return null;
    }

    return {
      roundNumber: latestRoundWithWinners.roundNumber,
      name: latestRoundWithWinners.name,
      drawnAt: latestRoundWithWinners.drawnAt,
      winners: latestRoundWithWinners.winners.map((w) => ({
        position: w.position,
        prizeAmount: w.prizeAmount,
        ticketNumber: w.ticket.ticketNumber,
        winnerDisplay:
          w.ticket.user?.username ? `@${w.ticket.user.username}` : w.ticket.user?.firstName || 'Winner',
      })),
    };
  }
}
