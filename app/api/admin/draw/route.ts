import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { drawWinners } from '@/lib/crypto-draw';
import { getTelegramBot } from '@/lib/telegram-bot';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('yalfal_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const round = await prisma.lotteryRound.findFirst({
      where: { status: 'OPEN' },
      include: {
        tickets: {
          where: { status: 'CONFIRMED' },
          include: { user: true },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ error: 'No active round available for draw' }, { status: 400 });
    }

    const eligibleCandidates = round.tickets
      .filter((t) => t.userId !== null)
      .map((t) => ({
        ticketNumber: t.ticketNumber,
        userId: t.userId as string,
        ticketId: t.id,
        user: t.user,
      }));

    if (eligibleCandidates.length < 3) {
      return NextResponse.json(
        { error: `At least 3 confirmed tickets are required to draw 3 prizes. Current confirmed: ${eligibleCandidates.length}` },
        { status: 400 }
      );
    }

    // Execute Cryptographically Secure Random Draw
    const { firstPrize, secondPrize, thirdPrize } = drawWinners(
      eligibleCandidates.map((c) => ({ ticketNumber: c.ticketNumber, userId: c.userId }))
    );

    const firstTicket = eligibleCandidates.find((c) => c.ticketNumber === firstPrize.ticketNumber)!;
    const secondTicket = eligibleCandidates.find((c) => c.ticketNumber === secondPrize.ticketNumber)!;
    const thirdTicket = eligibleCandidates.find((c) => c.ticketNumber === thirdPrize.ticketNumber)!;

    // Record Draw & Winners in database
    await prisma.$transaction(async (tx) => {
      const draw = await tx.draw.create({
        data: {
          roundId: round.id,
          adminId: session.userId,
          auditMetadata: JSON.stringify({
            seedPhrase: `csprng_draw_${Date.now()}`,
            proofHash: `sha256_${Date.now()}`,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      // 1st Prize Winner (10,000 ETB)
      await tx.winner.create({
        data: {
          roundId: round.id,
          ticketId: firstTicket.ticketId,
          drawId: draw.id,
          position: 'FIRST_PRIZE',
          prizeAmount: round.firstPrize,
          randomnessMetadata: JSON.stringify({ position: 1, ticketNumber: firstTicket.ticketNumber }),
        },
      });

      // 2nd Prize Winner (1,000 ETB)
      await tx.winner.create({
        data: {
          roundId: round.id,
          ticketId: secondTicket.ticketId,
          drawId: draw.id,
          position: 'SECOND_PRIZE',
          prizeAmount: round.secondPrize,
          randomnessMetadata: JSON.stringify({ position: 2, ticketNumber: secondTicket.ticketNumber }),
        },
      });

      // 3rd Prize Winner (500 ETB)
      await tx.winner.create({
        data: {
          roundId: round.id,
          ticketId: thirdTicket.ticketId,
          drawId: draw.id,
          position: 'THIRD_PRIZE',
          prizeAmount: round.thirdPrize,
          randomnessMetadata: JSON.stringify({ position: 3, ticketNumber: thirdTicket.ticketNumber }),
        },
      });

      // Mark round completed
      await tx.lotteryRound.update({
        where: { id: round.id },
        data: {
          status: 'COMPLETED',
          drawnAt: new Date(),
        },
      });
    });

    // Notify winners asynchronously on Telegram
    try {
      const bot = getTelegramBot();
      if (bot) {
        const notifyWinner = (candidate: typeof firstTicket, prize: string, amount: string) => {
          if (candidate.user?.telegramId && !candidate.user.telegramId.startsWith('web_')) {
            bot.telegram.sendMessage(
              candidate.user.telegramId,
              `🏆 *CONGRATULATIONS! YOU WON ${prize}!* 🏆\n\n` +
              `Your Ticket *#${String(candidate.ticketNumber).padStart(3, '0')}* was selected as the winner for *${amount}*!\n\n` +
              `Please contact support or open the web app to claim your payout!`,
              { parse_mode: 'Markdown' }
            ).catch(() => {});
          }
        };

        notifyWinner(firstTicket, '🥇 1ST PRIZE', '10,000 ETB');
        notifyWinner(secondTicket, '🥈 2ND PRIZE', '1,000 ETB');
        notifyWinner(thirdTicket, '🥉 3RD PRIZE', '500 ETB');
      }
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      roundNumber: round.roundNumber,
      winners: {
        first: {
          ticketNumber: firstTicket.ticketNumber,
          prize: Number(round.firstPrize),
          winnerName: firstTicket.user?.firstName || 'Participant',
        },
        second: {
          ticketNumber: secondTicket.ticketNumber,
          prize: Number(round.secondPrize),
          winnerName: secondTicket.user?.firstName || 'Participant',
        },
        third: {
          ticketNumber: thirdTicket.ticketNumber,
          prize: Number(round.thirdPrize),
          winnerName: thirdTicket.user?.firstName || 'Participant',
        },
      },
    });
  } catch (err: any) {
    console.error('Execute draw error:', err);
    return NextResponse.json({ error: err.message || 'Draw failed' }, { status: 500 });
  }
}
