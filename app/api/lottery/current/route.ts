import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let round = await prisma.lotteryRound.findFirst({
      where: { status: 'OPEN' },
      include: {
        tickets: {
          select: { id: true, ticketNumber: true, status: true },
        },
        winners: {
          include: {
            ticket: {
              include: {
                user: { select: { firstName: true, username: true } },
              },
            },
          },
        },
      },
      orderBy: { roundNumber: 'desc' },
    });

    // If no round exists, automatically initialize Round #1 with 200 tickets
    if (!round) {
      round = await prisma.lotteryRound.create({
        data: {
          roundNumber: 1,
          name: 'Yalfal Online Eta Round 1',
          maxTickets: 200,
          ticketPrice: 100,
          firstPrize: 10000,
          secondPrize: 1000,
          thirdPrize: 500,
          status: 'OPEN',
          tickets: {
            create: Array.from({ length: 200 }, (_, i) => ({
              ticketNumber: i + 1,
              status: 'AVAILABLE',
            })),
          },
        },
        include: {
          tickets: { select: { id: true, ticketNumber: true, status: true } },
          winners: {
            include: {
              ticket: {
                include: {
                  user: { select: { firstName: true, username: true } },
                },
              },
            },
          },
        },
      });
    }

    const soldCount = round.tickets.filter((t) => t.status === 'CONFIRMED').length;
    const reservedCount = round.tickets.filter((t) => t.status === 'RESERVED').length;
    const availableCount = 200 - soldCount - reservedCount;

    return NextResponse.json({
      round: {
        id: round.id,
        roundNumber: round.roundNumber,
        status: round.status,
        totalTickets: round.maxTickets,
        ticketPrice: round.ticketPrice,
        prizes: {
          first: Number(round.firstPrize),
          second: Number(round.secondPrize),
          third: Number(round.thirdPrize),
        },
        stats: {
          sold: soldCount,
          reserved: reservedCount,
          available: availableCount,
          percentSold: Math.round((soldCount / 200) * 100),
        },
        winners: round.winners,
      },
    });
  } catch (err: any) {
    console.warn('Fetch lottery error, serving active round fallback:', err?.message);
    return NextResponse.json({
      round: {
        id: 'round_1_active',
        roundNumber: 1,
        name: 'Yalfal Online Eta Round 1',
        status: 'OPEN',
        totalTickets: 200,
        ticketPrice: 100,
        prizes: {
          first: 10000,
          second: 1000,
          third: 500,
        },
        stats: {
          sold: 0,
          reserved: 0,
          available: 200,
          percentSold: 0,
        },
        winners: [],
      },
    });
  }
}
