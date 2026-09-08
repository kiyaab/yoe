import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (!session.role && !session.telegramId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const round = await prisma.lotteryRound.findFirst({
      where: { status: 'OPEN' },
      include: {
        tickets: true,
      },
    });

    const confirmedCount = round ? round.tickets.filter((t) => t.status === 'CONFIRMED').length : 0;
    const reservedCount = round ? round.tickets.filter((t) => t.status === 'RESERVED').length : 0;
    const availableCount = 200 - confirmedCount - reservedCount;
    const revenueETB = confirmedCount * 100;

    const pendingPaymentsCount = await prisma.payment.count({
      where: { status: 'PENDING' },
    });

    const totalUsers = await prisma.user.count();

    return NextResponse.json({
      roundNumber: round ? round.roundNumber : 1,
      roundStatus: round ? round.status : 'CLOSED',
      stats: {
        confirmedCount,
        reservedCount,
        availableCount,
        revenueETB,
        maxRevenueETB: 20000,
        pendingPaymentsCount,
        totalUsers,
      },
    });
  } catch (err: any) {
    console.warn('Database error in /api/admin/stats, serving default stats:', err?.message);
    return NextResponse.json({
      roundNumber: 1,
      roundStatus: 'OPEN',
      stats: {
        confirmedCount: 0,
        reservedCount: 0,
        availableCount: 200,
        revenueETB: 0,
        maxRevenueETB: 20000,
        pendingPaymentsCount: 0,
        totalUsers: 0,
      },
    });
  }
}
