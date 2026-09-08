import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('yalfal_token')?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Check if user is an admin
    if (payload.role) {
      const admin = await prisma.admin.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true, role: true },
      });
      if (admin) {
        return NextResponse.json({ authenticated: true, isAdmin: true, user: admin });
      }
    }

    // Standard user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
    const isAdmin = adminIds.includes(user.telegramId);

    return NextResponse.json({
      authenticated: true,
      isAdmin,
      user,
    });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('yalfal_token');
  return res;
}
