import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTelegramWebAppData, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8880998246:AAFkEAPFE2Jj1ZSpn3NzqxIqrgqvJXmVacM';

    if (!initData || !botToken) {
      return NextResponse.json({ error: 'Missing initData or bot configuration' }, { status: 400 });
    }

    const { valid, user: tgUser } = verifyTelegramWebAppData(initData, botToken);
    if (!valid || !tgUser) {
      return NextResponse.json({ error: 'Invalid Telegram authentication signature' }, { status: 401 });
    }

    // Upsert Telegram user in database with fallback
    let user: any;
    try {
      user = await prisma.user.upsert({
        where: { telegramId: tgUser.id.toString() },
        create: {
          telegramId: tgUser.id.toString(),
          username: tgUser.username || null,
          firstName: tgUser.first_name || 'Participant',
          lastName: tgUser.last_name || null,
        },
        update: {
          username: tgUser.username || null,
          firstName: tgUser.first_name || 'Participant',
          lastName: tgUser.last_name || null,
        },
      });
    } catch (err) {
      console.warn('Database offline on serverless host, using session user:', err);
      user = {
        id: `tg_${tgUser.id}`,
        telegramId: tgUser.id.toString(),
        username: tgUser.username || null,
        firstName: tgUser.first_name || 'Participant',
        lastName: tgUser.last_name || null,
        phone: null,
      };
    }

    // Check if user is in TELEGRAM_ADMIN_IDS
    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map((s) => s.trim());
    const isAdmin = adminIds.includes(tgUser.id.toString());

    const token = await createToken({
      userId: user.id,
      telegramId: user.telegramId,
      phone: user.phone || undefined,
      username: user.username || undefined,
      role: isAdmin ? 'ADMIN' : undefined,
    });

    const res = NextResponse.json({
      success: true,
      token, // Return token for Telegram Mini App SPA localStorage
      isAdmin,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        phone: user.phone,
        firstName: user.firstName,
        username: user.username,
      },
    });

    res.cookies.set('yalfal_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('Telegram auth error:', err);
    return NextResponse.json({ error: 'Telegram authentication failed' }, { status: 500 });
  }
}
