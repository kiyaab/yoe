import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createToken, normalizePhone } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { login: rawLogin, password } = await req.json();

    if (!rawLogin || !password) {
      return NextResponse.json({ error: 'Phone/Email and password are required' }, { status: 400 });
    }

    const trimmedLogin = rawLogin.trim();
    const normalizedPhoneLogin = normalizePhone(trimmedLogin);

    // Check admin first
    const admin = await prisma.admin.findUnique({
      where: { email: trimmedLogin },
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
          token,
          role: admin.role,
          user: { id: admin.id, name: admin.name, role: admin.role },
        });

        res.cookies.set('yalfal_token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 7 * 24 * 60 * 60,
          path: '/',
        });

        return res;
      }
    }

    // Check user by normalized phone, raw phone, or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhoneLogin },
          { phone: trimmedLogin },
          { username: trimmedLogin },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid phone/username or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid phone/username or password' }, { status: 401 });
    }

    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map((s) => s.trim());
    const isAdmin = adminIds.includes(user.telegramId);

    const token = await createToken({
      userId: user.id,
      phone: user.phone || undefined,
      telegramId: user.telegramId,
      username: user.username || undefined,
      role: isAdmin ? 'ADMIN' : undefined,
    });

    const res = NextResponse.json({
      success: true,
      token,
      isAdmin,
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
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
