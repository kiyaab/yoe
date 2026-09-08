import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: session.userId },
      include: {
        round: {
          select: { roundNumber: true, status: true, ticketPrice: true },
        },
        payment: {
          select: { id: true, status: true, amount: true, method: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tickets });
  } catch (err: any) {
    console.warn('Database error in /api/tickets/my, serving empty list:', err?.message);
    return NextResponse.json({ tickets: [] });
  }
}
