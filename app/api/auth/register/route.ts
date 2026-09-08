import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken, normalizePhone, verifyTelegramWebAppData } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phone: rawPhone, password, firstName, lastName } = await req.json();

    if (!rawPhone || !password) {
      return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone);
    if (!phone || phone.length < 9) {
      return NextResponse.json({ error: 'Please enter a valid phone number (e.g. 0911223344)' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    // Check if user with this phone already exists
    const existingByPhone = await prisma.user.findFirst({
      where: { phone },
    });

    if (existingByPhone) {
      return NextResponse.json(
        {
          error: `An account with phone number ${phone} already exists.`,
          code: 'PHONE_EXISTS',
          phone,
        },
        { status: 409 }
      );
    }

    // Check if user is inside Telegram WebApp
    const tgInitData = req.headers.get('x-telegram-init-data');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    let tgUser: any = null;

    if (tgInitData && botToken) {
      const tgAuth = verifyTelegramWebAppData(tgInitData, botToken);
      if (tgAuth.valid && tgAuth.user) {
        tgUser = tgAuth.user;
      }
    }

    const passwordHash = await hashPassword(password);
    let user;

    if (tgUser) {
      // If Telegram user already exists in DB (e.g. from bot interaction), update profile
      const existingTgUser = await prisma.user.findUnique({
        where: { telegramId: tgUser.id.toString() },
      });

      if (existingTgUser) {
        user = await prisma.user.update({
          where: { id: existingTgUser.id },
          data: {
            phone,
            passwordHash,
            firstName: firstName || existingTgUser.firstName || tgUser.first_name || 'Participant',
            lastName: lastName || existingTgUser.lastName || tgUser.last_name || '',
            username: tgUser.username || existingTgUser.username,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            phone,
            passwordHash,
            firstName: firstName || tgUser.first_name || 'Participant',
            lastName: lastName || tgUser.last_name || '',
            telegramId: tgUser.id.toString(),
            username: tgUser.username || null,
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          phone,
          passwordHash,
          firstName: firstName || 'Participant',
          lastName: lastName || '',
          telegramId: `web_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      });
    }

    const token = await createToken({
      userId: user.id,
      phone: user.phone || undefined,
      telegramId: user.telegramId,
      username: user.username || undefined,
    });

    const res = NextResponse.json({
      success: true,
      token, // Return token for SPA & Telegram Mini App localStorage
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        telegramId: user.telegramId,
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
    console.error('Registration error:', err);
    return NextResponse.json({ error: err?.message || 'Registration failed' }, { status: 500 });
  }
}

