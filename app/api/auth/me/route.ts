import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.userId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Check if user is an admin
    if (session.role === 'ADMIN') {
      const admin = await prisma.admin.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, name: true, role: true },
      });
      if (admin) {
        return NextResponse.json({ authenticated: true, isAdmin: true, user: admin });
      }
    }

    // Standard user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        username: true,
        telegramId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map((s) => s.trim());
    const isAdmin = adminIds.includes(user.telegramId) || session.role === 'ADMIN';

    return NextResponse.json({
      authenticated: true,
      isAdmin,
      user,
    });
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    return NextResponse.json({ authenticated: false, user: null });
  }
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('yalfal_token');
  return res;
}

