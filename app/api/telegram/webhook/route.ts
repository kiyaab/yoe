import { NextRequest, NextResponse } from 'next/server';
import { getTelegramBot } from '@/lib/telegram-bot';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret) {
      const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (headerSecret !== secret) {
        return NextResponse.json({ error: 'Unauthorized secret token' }, { status: 401 });
      }
    }

    const bot = getTelegramBot();
    if (!bot) {
      return NextResponse.json({ error: 'Telegram bot not initialized' }, { status: 500 });
    }

    const body = await req.json();
    await bot.handleUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active', service: 'Telegram Webhook Handler' });
}
