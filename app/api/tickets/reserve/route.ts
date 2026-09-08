import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { acquireLock, releaseLock } from '@/lib/redis';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('yalfal_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Please log in to select numbers' }, { status: 401 });
  }

  const session = await verifyToken(token);
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ticketNumber } = await req.json();
  if (!ticketNumber || ticketNumber < 1 || ticketNumber > 200) {
    return NextResponse.json({ error: 'Invalid ticket number (must be 1–200)' }, { status: 400 });
  }

  const round = await prisma.lotteryRound.findFirst({
    where: { status: 'OPEN' },
  });

  if (!round) {
    return NextResponse.json({ error: 'No active round open' }, { status: 400 });
  }

  const lockKey = `lock:ticket:${round.id}:${ticketNumber}`;
  const acquired = await acquireLock(lockKey, 10);
  if (!acquired) {
    return NextResponse.json({ error: 'Ticket is currently being selected by another user' }, { status: 409 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: {
          roundId_ticketNumber: {
            roundId: round.id,
            ticketNumber,
          },
        },
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      if (ticket.status !== 'AVAILABLE') {
        throw new Error(`Number #${ticketNumber} is already taken or reserved`);
      }

      const updated = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'RESERVED',
          userId: session.userId,
          reservedAt: new Date(),
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: result.id,
        ticketNumber: result.ticketNumber,
        status: result.status,
        roundNumber: round.roundNumber,
        price: round.ticketPrice,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reserve ticket' }, { status: 400 });
  } finally {
    await releaseLock(lockKey);
  }
}
