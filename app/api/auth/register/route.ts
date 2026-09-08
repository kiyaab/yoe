import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { phone, password, firstName, lastName } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: { phone },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this phone number already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        firstName: firstName || 'Participant',
        lastName: lastName || '',
        telegramId: `web_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      },
    });

    const token = await createToken({
      userId: user.id,
      phone: user.phone || undefined,
      telegramId: user.telegramId,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    res.cookies.set('yalfal_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
