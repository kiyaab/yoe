import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RoundStatus,
  TicketStatus,
  WinnerPosition,
  NotificationStatus,
} from '@prisma/client';
import { ExecuteDrawDto } from './dto/execute-draw.dto';
import { selectCryptographicWinner } from '../common/utils/crypto-draw.util';

@Injectable()
export class DrawsService {
  constructor(private prisma: PrismaService) {}

  async getEligibleParticipants(roundId: string) {
    const round = await this.prisma.lotteryRound.findUnique({
      where: { id: roundId },
      include: {
        winners: {
          include: { ticket: true },
        },
      },
    });

    if (!round) {
      throw new NotFoundException(`Round ${roundId} not found`);
    }

    const eligibleTickets = await this.prisma.ticket.findMany({
      where: {
        roundId,
        status: TicketStatus.CONFIRMED,
      },
      include: {
        user: { select: { id: true, username: true, firstName: true } },
      },
      orderBy: { ticketNumber: 'asc' },
    });

    const winnersMap = new Map(round.winners.map((w) => [w.position, w]));

    return {
      round: {
        id: round.id,
        roundNumber: round.roundNumber,
        name: round.name,
        ticketPrice: round.ticketPrice,
        firstPrize: round.firstPrize,
        secondPrize: round.secondPrize,
        thirdPrize: round.thirdPrize,
        status: round.status,
      },
      eligibleCount: eligibleTickets.length,
      eligibleTickets: eligibleTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        username: t.user?.username || t.user?.firstName || 'Participant',
      })),
      existingWinners: {
        firstPrize: winnersMap.get(WinnerPosition.FIRST_PRIZE) || null,
        secondPrize: winnersMap.get(WinnerPosition.SECOND_PRIZE) || null,
        thirdPrize: winnersMap.get(WinnerPosition.THIRD_PRIZE) || null,
      },
    };
  }

  async executeDraw(dto: ExecuteDrawDto, adminId: string) {
    const round = await this.prisma.lotteryRound.findUnique({
      where: { id: dto.roundId },
      include: {
        winners: true,
      },
    });

    if (!round) {
      throw new NotFoundException('Lottery round not found');
    }

    if (round.status === RoundStatus.COMPLETED) {
      throw new BadRequestException('This round has already completed all prize draws.');
    }

    // 1. Immutable check: has this prize already been drawn?
    const existingPositionWinner = round.winners.find((w) => w.position === dto.position);
    if (existingPositionWinner) {
      throw new ConflictException(
        `${dto.position} has already been securely drawn and cannot be redrawn. Result is immutable.`
      );
    }

    // 2. Fetch all approved / confirmed tickets
    const confirmedTickets = await this.prisma.ticket.findMany({
      where: {
        roundId: dto.roundId,
        status: TicketStatus.CONFIRMED,
      },
      include: {
        user: true,
      },
    });

    if (confirmedTickets.length === 0) {
      throw new BadRequestException(
        'Cannot execute draw: No confirmed/approved tickets found in this round.'
      );
    }

    // 3. Exclude tickets that already won a previous prize in this round!
    // (1st winner cannot win 2nd or 3rd prize; 2nd winner cannot win 3rd prize)
    const excludedTicketIds = round.winners.map((w) => w.ticketId);

    // 4. Determine Prize Amount
    let prizeAmount = round.firstPrize;
    if (dto.position === WinnerPosition.SECOND_PRIZE) prizeAmount = round.secondPrize;
    if (dto.position === WinnerPosition.THIRD_PRIZE) prizeAmount = round.thirdPrize;

    // 5. Cryptographically Secure Selection Engine
    const selection = selectCryptographicWinner(
      confirmedTickets.map((t) => ({
        id: t.id,
        ticketNumber: t.ticketNumber,
        userId: t.userId,
      })),
      excludedTicketIds
    );

    const winningTicket = confirmedTickets.find((t) => t.id === selection.winnerTicketId)!;

    // 6. Execute atomic persistence in database transaction
    return this.prisma.$transaction(async (tx) => {
      // Find or create Draw record
      let draw = await tx.draw.findFirst({
        where: { roundId: dto.roundId },
      });

      if (!draw) {
        draw = await tx.draw.create({
          data: {
            roundId: dto.roundId,
            adminId,
            startedAt: new Date(),
          },
        });
      }

      // Record Winner
      const winner = await tx.winner.create({
        data: {
          roundId: dto.roundId,
          ticketId: winningTicket.id,
          drawId: draw.id,
          position: dto.position,
          prizeAmount,
          randomnessMetadata: JSON.stringify(selection.randomnessMetadata),
        },
        include: {
          ticket: {
            include: { user: true },
          },
          round: true,
        },
      });

      // Check if all 3 prizes are now drawn
      const totalWinnersCount = await tx.winner.count({
        where: { roundId: dto.roundId },
      });

      if (totalWinnersCount >= 3) {
        await tx.lotteryRound.update({
          where: { id: dto.roundId },
          data: {
            status: RoundStatus.COMPLETED,
            drawnAt: new Date(),
          },
        });
        await tx.draw.update({
          where: { id: draw.id },
          data: { completedAt: new Date() },
        });
      } else {
        await tx.lotteryRound.update({
          where: { id: dto.roundId },
          data: { status: RoundStatus.DRAWING },
        });
      }

      // Create Winner Notification
      if (winningTicket.userId) {
        await tx.notification.create({
          data: {
            userId: winningTicket.userId,
            telegramId: winningTicket.user?.telegramId,
            title: `🏆 CONGRATULATIONS! YOU WON ${prizeAmount.toLocaleString()} ETB!`,
            message: `Your lucky Ticket #${String(winningTicket.ticketNumber).padStart(
              3,
              '0'
            )} won ${dto.position.replace('_', ' ')} in Round #${round.roundNumber}!`,
            type: 'WINNER_ANNOUNCEMENT',
            status: NotificationStatus.PENDING,
          },
        });
      }

      // Record administrative audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'EXECUTE_DRAW',
          entity: 'Draw',
          entityId: draw.id,
          metadata: JSON.stringify({
            roundNumber: round.roundNumber,
            position: dto.position,
            winningTicketNumber: winningTicket.ticketNumber,
            prizeAmount,
            randomness: selection.randomnessMetadata,
          }),
        },
      });

      return {
        success: true,
        winner: {
          position: winner.position,
          prizeAmount: winner.prizeAmount,
          ticketNumber: winningTicket.ticketNumber,
          ticketId: winningTicket.id,
          winnerName: winningTicket.user?.username || winningTicket.user?.firstName || 'Anonymous Participant',
          telegramId: winningTicket.user?.telegramId || null,
        },
        randomnessAudit: selection.randomnessMetadata,
        roundCompleted: totalWinnersCount >= 3,
      };
    });
  }
}
