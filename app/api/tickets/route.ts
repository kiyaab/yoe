import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const round = await prisma.lotteryRound.findFirst({
      where: { status: 'OPEN' },
      include: {
        tickets: {
          select: {
            ticketNumber: true,
            status: true,
            userId: true,
          },
          orderBy: { ticketNumber: 'asc' },
        },
      },
    });

    if (!round) {
      return NextResponse.json({ tickets: [] });
    }

    return NextResponse.json({
      roundId: round.id,
      roundNumber: round.roundNumber,
      ticketPrice: round.ticketPrice,
      tickets: round.tickets,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}
