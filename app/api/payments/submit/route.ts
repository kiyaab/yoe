import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { getTelegramBot } from '@/lib/telegram-bot';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'Please log in to submit receipts' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const ticketId = formData.get('ticketId') as string | null;
    const method = (formData.get('method') as string) || 'CBE';
    const referenceInput = (formData.get('reference') as string) || '';

    if (!file || !ticketId) {
      return NextResponse.json({ error: 'Receipt file and ticket ID are required' }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { round: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.status === 'CONFIRMED') {
      return NextResponse.json({ error: 'This ticket has already been confirmed' }, { status: 400 });
    }

    // Convert file to Buffer & calculate SHA-256 hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Duplicate check
    const existingReceipt = await prisma.receipt.findUnique({
      where: { hash: fileHash },
    });

    if (existingReceipt) {
      return NextResponse.json(
        { error: 'Fraud Protection: This receipt has already been submitted on the platform.' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
    await fs.mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || '.jpg';
    const filename = `receipt_${Date.now()}_${fileHash.slice(0, 10)}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    const generatedRef = referenceInput || `TXN_${Date.now()}_${ticket.ticketNumber}`;

    // Create Payment and Receipt in a transaction
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          userId: session.userId,
          ticketId: ticket.id,
          amount: ticket.round.ticketPrice,
          method: method === 'TELEBIRR' ? 'TELEBIRR' : 'CBE',
          status: 'PENDING',
          reference: generatedRef,
        },
      });

      await tx.receipt.create({
        data: {
          paymentId: p.id,
          originalName: filename,
          size: buffer.length,
          mimeType: file.type || 'image/jpeg',
          storageKey: `/uploads/receipts/${filename}`,
          hash: fileHash,
        },
      });

      // Update ticket status to RESERVED if not already
      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'RESERVED',
          userId: session.userId,
          reservedAt: new Date(),
        },
      });

      return p;
    });

    // Notify Telegram Admins asynchronously
    try {
      const bot = getTelegramBot();
      const adminIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

      if (bot && adminIds.length > 0) {
        const adminText =
          `💳 *NEW PAYMENT RECEIPT SUBMITTED*\n\n` +
          `• Ticket: *#${String(ticket.ticketNumber).padStart(3, '0')}*\n` +
          `• Method: *${method}*\n` +
          `• Amount: *${ticket.round.ticketPrice} ETB*\n` +
          `• Reference: \`${generatedRef}\`\n\n` +
          `Open the WebApp Admin Suite to review and approve!`;

        for (const adminId of adminIds) {
          bot.telegram.sendMessage(adminId, adminText, { parse_mode: 'Markdown' }).catch(() => {});
        }
      }
    } catch {
      // Non-blocking notification
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      ticketNumber: ticket.ticketNumber,
      status: 'PENDING',
      message: 'Receipt uploaded successfully. Admin verification in progress.',
    });
  } catch (err: any) {
    console.error('Submit receipt error:', err);
    return NextResponse.json({ error: 'Failed to process payment receipt' }, { status: 500 });
  }
}
