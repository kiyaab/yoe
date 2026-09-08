import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { getTelegramBot } from '@/lib/telegram-bot';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('yalfal_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: {
        receipt: true,
        user: { select: { firstName: true, username: true, phone: true, telegramId: true } },
        ticket: { select: { ticketNumber: true, id: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ payments });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch pending payments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('yalfal_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await verifyToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { paymentId, action, reason } = await req.json();

    if (!paymentId || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { ticket: true, user: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const bot = getTelegramBot();

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
          },
        });

        if (payment.ticketId) {
          await tx.ticket.update({
            where: { id: payment.ticketId },
            data: {
              status: 'CONFIRMED',
            },
          });
        }
      });

      // Notify user on Telegram if applicable
      if (bot && payment.user?.telegramId && !payment.user.telegramId.startsWith('web_')) {
        const ticketFormatted = payment.ticket ? `#${String(payment.ticket.ticketNumber).padStart(3, '0')}` : '';
        bot.telegram.sendMessage(
          payment.user.telegramId,
          `🎉 *PAYMENT APPROVED!*\n\nYour payment for Ticket *${ticketFormatted}* has been verified! Your number is now locked into the live lottery draw. Good luck! 🏆`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }

      return NextResponse.json({ success: true, status: 'APPROVED' });
    } else {
      // REJECT
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REJECTED',
            rejectionReason: reason || 'Invalid receipt',
            reviewedAt: new Date(),
          },
        });

        // Release ticket back to AVAILABLE
        if (payment.ticketId) {
          await tx.ticket.update({
            where: { id: payment.ticketId },
            data: {
              status: 'AVAILABLE',
              userId: null,
            },
          });
        }
      });

      if (bot && payment.user?.telegramId && !payment.user.telegramId.startsWith('web_')) {
        const ticketFormatted = payment.ticket ? `#${String(payment.ticket.ticketNumber).padStart(3, '0')}` : '';
        bot.telegram.sendMessage(
          payment.user.telegramId,
          `❌ *PAYMENT REJECTED*\n\nYour payment submission for Ticket *${ticketFormatted}* could not be verified.\n*Reason:* ${reason || 'Receipt unreadable or invalid'}\n\nThe number has been returned to the pool. Please submit a valid receipt to try again.`,
          { parse_mode: 'Markdown' }
        ).catch(() => {});
      }

      return NextResponse.json({ success: true, status: 'REJECTED' });
    }
  } catch (err: any) {
    console.error('Payment review error:', err);
    return NextResponse.json({ error: 'Failed to process payment review' }, { status: 500 });
  }
}
