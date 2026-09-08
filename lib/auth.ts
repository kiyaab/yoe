import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'yalfal_jwt_super_secret_production_key_2026'
);

export interface SessionPayload {
  userId: string;
  role?: string;
  telegramId?: string;
  phone?: string;
  username?: string;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Normalizes Ethiopian phone numbers to standard 10-digit format (e.g. 0911223344 or 0711223344).
 */
export function normalizePhone(input: string): string {
  if (!input) return '';
  let cleaned = input.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+251')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('251')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('9') && cleaned.length === 9) {
    cleaned = '0' + cleaned;
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

/**
 * Validates Telegram Mini App window.Telegram.WebApp.initData
 */
export function verifyTelegramWebAppData(initDataString: string, botToken: string): { valid: boolean; user?: any } {
  try {
    if (!initDataString || !botToken) return { valid: false };

    const urlParams = new URLSearchParams(initDataString);
    const hash = urlParams.get('hash');
    if (!hash) return { valid: false };

    urlParams.delete('hash');

    const params: string[] = [];
    urlParams.forEach((val, key) => {
      params.push(`${key}=${val}`);
    });
    params.sort();
    const dataCheckString = params.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
      const userParam = urlParams.get('user');
      const user = userParam ? JSON.parse(userParam) : null;
      return { valid: true, user };
    }
    return { valid: false };
  } catch (err) {
    return { valid: false };
  }
}

/**
 * Universal session extractor that supports:
 * 1. Authorization: Bearer <token> header (standard for SPA & Telegram Mini App)
 * 2. x-telegram-init-data header (auto-authenticates Telegram WebApp requests)
 * 3. yalfal_token cookie (for standard browser sessions)
 */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  try {
    // 1. Check Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization');
    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }

    // 2. Fallback to cookie
    if (!token) {
      token = req.cookies.get('yalfal_token')?.value;
    }

    if (token) {
      const session = await verifyToken(token);
      if (session && session.userId) {
        return session;
      }
    }

    // 3. Fallback to Telegram WebApp direct verification from header
    const tgInitData = req.headers.get('x-telegram-init-data');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (tgInitData && botToken) {
      const { valid, user: tgUser } = verifyTelegramWebAppData(tgInitData, botToken);
      if (valid && tgUser) {
        // Find or create Telegram user
        const dbUser = await prisma.user.upsert({
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

        const adminIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map((s) => s.trim());
        const isAdmin = adminIds.includes(tgUser.id.toString());

        return {
          userId: dbUser.id,
          telegramId: dbUser.telegramId,
          phone: dbUser.phone || undefined,
          username: dbUser.username || undefined,
          role: isAdmin ? 'ADMIN' : undefined,
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Session extraction error:', err);
    return null;
  }
}

