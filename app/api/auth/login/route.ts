import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json({ error: 'Phone/Email and password are required' }, { status: 400 });
    }

    // Check admin first
    const admin = await prisma.admin.findUnique({
      where: { email: login },
    });

    if (admin) {
      const match = await comparePassword(password, admin.passwordHash);
      if (match) {
        const token = await createToken({
          userId: admin.id,
          role: admin.role,
        });

        const res = NextResponse.json({
          success: true,
          role: admin.role,
          user: { id: admin.id, name: admin.name, role: admin.role },
        });

        res.cookies.set('yalfal_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });

        return res;
      }
    }

    // Check user by phone or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: login }, { username: login }],
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

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
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
