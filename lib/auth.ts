import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

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
