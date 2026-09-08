import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { PaymentsService } from '../payments/payments.service';
import { ReceiptsService } from '../receipts/receipts.service';
import { DrawsService } from '../draws/draws.service';
import { BotKeyboards } from './bot.keyboards';
import {
  RoundStatus,
  TicketStatus,
  PaymentStatus,
  PaymentMethodCode,
  WinnerPosition,
} from '@prisma/client';
import * as crypto from 'crypto';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class BotService implements OnModuleInit {
  private bot: Telegraf;
  private readonly logger = new Logger(BotService.name);
  private adminIds: string[] = [];
  private isRunning = false;
  private botInfo: any = null;

  constructor(
    private prisma: PrismaService,
    private ticketsService: TicketsService,
    private paymentsService: PaymentsService,
    private receiptsService: ReceiptsService,
    private drawsService: DrawsService
  ) {}

  async onModuleInit() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const adminIdsEnv = process.env.TELEGRAM_ADMIN_IDS || '';
    this.adminIds = adminIdsEnv
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (token && !token.includes('FakeToken') && token.length > 20) {
      await this.startBotInstance(token);
    } else {
      this.logger.warn(
        '⚠️ TELEGRAM_BOT_TOKEN is not configured or is a placeholder. Update your .env file to launch the bot.'
      );
    }
  }

  async startBotInstance(token: string) {
    try {
      if (this.bot) {
        try {
          this.bot.stop('restarting');
        } catch (e) {}
      }

      this.bot = new Telegraf(token);
      this.registerHandlers();

      this.botInfo = await this.bot.telegram.getMe();
      this.logger.log(`🤖 Telegram Bot authenticated successfully as @${this.botInfo.username}`);

      const botMode = process.env.TELEGRAM_BOT_MODE || 'polling';
      if (botMode === 'webhook') {
        const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
        const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

        if (!webhookUrl) {
          this.logger.error('❌ TELEGRAM_BOT_MODE=webhook requires TELEGRAM_WEBHOOK_URL to be set.');
          this.isRunning = false;
          return { success: false, error: 'TELEGRAM_WEBHOOK_URL is required' };
        }

        await this.setupWebhookWithRetry(webhookUrl, webhookSecret);
        this.isRunning = true;
      } else {
        this.bot.launch().catch((err) => {
          this.logger.error('Telegram bot polling error:', err);
          this.isRunning = false;
        });
        this.isRunning = true;
        this.logger.log('🤖 Telegram Bot launched in Long Polling mode (development)');
      }
      return { success: true, bot: this.botInfo };
    } catch (err: any) {
      this.logger.error(`Failed to connect Telegram bot: ${err.message}`);
      this.isRunning = false;
      return { success: false, error: err.message };
    }
  }

  private async setupWebhookWithRetry(url: string, secret?: string, maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.bot.telegram.setWebhook(url, {
          secret_token: secret,
          drop_pending_updates: false,
        });
        this.logger.log(`🚀 Production Telegram Webhook configured at: ${url}`);
        const webhookInfo = await this.bot.telegram.getWebhookInfo();
        this.logger.log(
          `📡 Webhook verified. URL: ${webhookInfo.url}, Pending updates: ${webhookInfo.pending_update_count}`
        );
        return;
      } catch (err: any) {
        this.logger.warn(`Webhook setup attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
        if (attempt < maxAttempts) {
          await sleep(2000 * attempt);
        } else {
          this.logger.error(
            `❌ Failed to configure Telegram webhook after ${maxAttempts} attempts: ${err.message}`
          );
          throw err;
        }
      }
    }
  }

  getStatus() {
    return {
      connected: this.isRunning,
      botUsername: this.botInfo?.username || process.env.TELEGRAM_BOT_USERNAME || 'yalfalonlinebot',
      botName: this.botInfo?.first_name || 'Yalfal Online Eta',
      mode: process.env.TELEGRAM_BOT_MODE || 'polling',
      tokenSet: !!(process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_BOT_TOKEN.includes('FakeToken')),
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || null,
    };
  }

  private isAdmin(telegramId: string): boolean {
    return this.adminIds.includes(telegramId);
  }

  private registerHandlers() {
    // ==========================================
    // 1. /start & Main Menu
    // ==========================================
    this.bot.start(async (ctx) => {
      const from = ctx.from;
      if (from) {
        await this.prisma.user.upsert({
          where: { telegramId: from.id.toString() },
          update: {
            username: from.username || null,
            firstName: from.first_name || null,
            lastName: from.last_name || null,
          },
          create: {
            telegramId: from.id.toString(),
            username: from.username || null,
            firstName: from.first_name || null,
            lastName: from.last_name || null,
          },
        });
      }

      const welcomeText =
        `🎡 *YALFAL ONLINE ETA*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Your Number.\n` +
        `Your Chance.\n` +
        `Your Moment. 🍀\n\n` +
        `🎟 *Entry:* 100 ETB\n\n` +
        `🏆 *Current Prizes*\n\n` +
        `🥇 10,000 ETB\n` +
        `🥈 1,000 ETB\n` +
        `🥉 500 ETB\n\n` +
        `🎟 *Numbers:* 1–200\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Choose an option below:`;

      return ctx.replyWithMarkdown(welcomeText, BotKeyboards.mainMenu());
    });

    this.bot.action('main_menu', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const menuText =
        `🎡 *YALFAL ONLINE ETA*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Your Number.\n` +
        `Your Chance.\n` +
        `Your Moment. 🍀\n\n` +
        `🎟 *Entry:* 100 ETB\n\n` +
        `🏆 *Current Prizes*\n` +
        `🥇 10,000 ETB | 🥈 1,000 ETB | 🥉 500 ETB\n\n` +
        `Choose an option below:`;

      return ctx.editMessageText(menuText, {
        parse_mode: 'Markdown',
        ...BotKeyboards.mainMenu(),
      });
    });

    // ==========================================
    // 2. Current Draw Status
    // ==========================================
    this.bot.action('view_current_draw', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const round = await this.prisma.lotteryRound.findFirst({
        where: { status: { in: [RoundStatus.OPEN, RoundStatus.FULL, RoundStatus.DRAWING] } },
        orderBy: { roundNumber: 'desc' },
        include: { tickets: true },
      });

      if (!round) {
        return ctx.editMessageText(
          `🎡 *CURRENT DRAW*\n━━━━━━━━━━━━━━━━━━\n\nNo lottery round is active right now. Check back soon!`,
          {
            parse_mode: 'Markdown',
            ...BotKeyboards.backToMenu(),
          }
        );
      }

      const soldCount = round.tickets.filter((t) => t.status === TicketStatus.CONFIRMED).length;
      const availableCount = round.tickets.filter((t) => t.status === TicketStatus.AVAILABLE).length;

      const text =
        `🎡 *CURRENT DRAW*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Round #${String(round.roundNumber).padStart(3, '0')}\n\n` +
        `🎟 *Price:*\n${round.ticketPrice} ETB\n\n` +
        `🎯 *Capacity:*\n${round.maxTickets}\n\n` +
        `🎟 *Sold:*\n${soldCount}\n\n` +
        `🟢 *Available:*\n${availableCount}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🏆 *PRIZES*\n\n` +
        `🥇 ${round.firstPrize.toLocaleString()} ETB\n` +
        `🥈 ${round.secondPrize.toLocaleString()} ETB\n` +
        `🥉 ${round.thirdPrize.toLocaleString()} ETB\n\n` +
        `*Status:*\n${round.status === RoundStatus.OPEN ? '🟢 OPEN' : round.status === RoundStatus.FULL ? '🟡 FULL' : '🔵 DRAWING'}`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.backToMenuWithRefresh('view_current_draw'),
      });
    });

    // ==========================================
    // 3. Buy Number Pagination (1–200)
    // ==========================================
    this.bot.action(/buy_page_(\d+)/, async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const page = parseInt(ctx.match[1], 10);
      const activeRound = await this.prisma.lotteryRound.findFirst({
        where: { status: RoundStatus.OPEN },
        orderBy: { roundNumber: 'desc' },
        include: { tickets: true },
      });

      if (!activeRound) {
        return ctx.editMessageText('No active lottery round is open right now. Please check back soon!', {
          ...BotKeyboards.backToMenu(),
        });
      }

      const ticketsMap = new Map<number, TicketStatus>();
      activeRound.tickets.forEach((t) => ticketsMap.set(t.ticketNumber, t.status));

      const pageSize = 20;
      const startNum = page * pageSize + 1;
      const endNum = Math.min(200, startNum + pageSize - 1);

      const messageText =
        `🎟 *CHOOSE YOUR LUCKY NUMBER*\n\n` +
        `Entry fee: *100 ETB*\n\n` +
        `🟢 Available | 🔴 Taken\n\n` +
        `Showing numbers *${startNum}–${endNum}*:`;

      return ctx.editMessageText(messageText, {
        parse_mode: 'Markdown',
        ...BotKeyboards.buyPagination(page, ticketsMap),
      });
    });

    this.bot.action(/num_taken_(\d+)/, async (ctx) => {
      const num = ctx.match[1];
      return ctx.answerCbQuery(`Number #${num} is already taken! Please choose another number.`, {
        show_alert: true,
      });
    });

    // ==========================================
    // 4. Number Selection Confirmation
    // ==========================================
    this.bot.action(/pick_num_(\d+)/, async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const num = parseInt(ctx.match[1], 10);
      const activeRound = await this.prisma.lotteryRound.findFirst({
        where: { status: RoundStatus.OPEN },
        orderBy: { roundNumber: 'desc' },
      });

      if (!activeRound) {
        return ctx.reply('No active lottery round is open right now.');
      }

      const confirmText =
        `🎟 *NUMBER SELECTED*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Your Number:\n*#${String(num).padStart(3, '0')}*\n\n` +
        `Entry:\n*100 ETB*\n\n` +
        `Round:\n*#${String(activeRound.roundNumber).padStart(3, '0')}*\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Would you like to continue?`;

      return ctx.editMessageText(confirmText, {
        parse_mode: 'Markdown',
        ...BotKeyboards.numberConfirmation(num),
      });
    });

    // ==========================================
    // 5. Confirm Selection & Payment Method
    // ==========================================
    this.bot.action(/confirm_num_(\d+)/, async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const num = parseInt(ctx.match[1], 10);
      const telegramId = ctx.from.id.toString();

      try {
        const result = await this.ticketsService.reserveTicket({
          ticketNumber: num,
          telegramId,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
        });

        const ticket = result.ticket;

        const paymentText =
          `💳 *PAYMENT METHOD*\n\n` +
          `Selected Ticket: *#${String(num).padStart(3, '0')}*\n` +
          `Amount: *100 ETB*\n\n` +
          `Select how you want to pay:`;

        return ctx.editMessageText(paymentText, {
          parse_mode: 'Markdown',
          ...BotKeyboards.paymentMethod(ticket.id),
        });
      } catch (err: any) {
        return ctx.reply(err.message || 'Could not reserve this number. It might have just been taken.');
      }
    });

    // ==========================================
    // 6. Payment Instructions (CBE & Telebirr)
    // ==========================================
    this.bot.action(/pay_method_(CBE|TELEBIRR)_(.+)/, async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const methodCode = ctx.match[1] as PaymentMethodCode;
      const ticketId = ctx.match[2];

      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { round: true },
      });

      if (!ticket) {
        return ctx.reply('Ticket reservation expired or not found.');
      }

      const method = await this.prisma.paymentMethod.findUnique({
        where: { code: methodCode },
      });

      const accountName = method?.accountName || 'Yalfal Online Eta';
      const accountNumber = method?.accountNumber || (methodCode === 'CBE' ? '1000234567891' : '0911223344');

      // Initialize pending payment
      await this.paymentsService.createPayment({
        ticketId,
        method: methodCode,
        amount: 100.0,
      });

      let text = '';
      if (methodCode === 'CBE') {
        text =
          `🏦 *CBE PAYMENT*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `Amount:\n*100 ETB*\n\n` +
          `Account Name:\n*${accountName}*\n\n` +
          `Account Number:\n\`${accountNumber}\` (Tap to copy)\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `1. Transfer 100 ETB.\n` +
          `2. Keep your receipt.\n` +
          `3. Press the button below.\n` +
          `4. Upload the receipt.\n\n` +
          `⚠️ Your ticket is NOT confirmed until the payment is approved.`;
      } else {
        text =
          `📱 *TELEBIRR PAYMENT*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `Amount:\n*100 ETB*\n\n` +
          `Account Name:\n*${accountName}*\n\n` +
          `Phone:\n\`${accountNumber}\` (Tap to copy)\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `1. Complete the 100 ETB transfer.\n` +
          `2. Take a screenshot or save receipt.\n` +
          `3. Press the button below to upload.`;
      }

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.uploadReceipt(ticketId),
      });
    });

    this.bot.action(/upload_prompt_(.+)/, async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const ticketId = ctx.match[1];
      const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
      const numStr = ticket ? `#${String(ticket.ticketNumber).padStart(3, '0')}` : '';

      return ctx.replyWithMarkdown(
        `📤 *SEND PAYMENT RECEIPT*\n\n` +
          `Please send your CBE or Telebirr payment receipt as a photo or document now.\n\n` +
          `Ticket: *${numStr}*\n` +
          `Amount: *100 ETB*`
      );
    });

    this.bot.action(/cancel_ticket_(.+)/, async (ctx) => {
      try {
        await ctx.answerCbQuery('Ticket selection cancelled');
      } catch (e) {}

      const ticketId = ctx.match[1];
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.AVAILABLE, userId: null, reservedAt: null },
      });

      return ctx.editMessageText('❌ Ticket selection has been cancelled.', {
        ...BotKeyboards.backToMenu(),
      });
    });

    // ==========================================
    // 7. Receipt Photo / Document Upload Handler
    // ==========================================
    this.bot.on(['photo', 'document'], async (ctx) => {
      const telegramId = ctx.from.id.toString();

      // Find user's latest payment awaiting receipt
      const pendingPayment = await this.prisma.payment.findFirst({
        where: {
          user: { telegramId },
          status: PaymentStatus.PENDING,
        },
        include: {
          ticket: { include: { round: true } },
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!pendingPayment) {
        return ctx.reply(
          'ℹ You do not have an active ticket awaiting payment. Please use /start and choose a number first!',
          BotKeyboards.backToMenu()
        );
      }

      let fileId = '';
      let mimeType = 'image/jpeg';
      let originalName = 'telegram_receipt.jpg';

      if ('photo' in ctx.message && ctx.message.photo.length > 0) {
        const largest = ctx.message.photo[ctx.message.photo.length - 1];
        fileId = largest.file_id;
      } else if ('document' in ctx.message) {
        fileId = ctx.message.document.file_id;
        mimeType = ctx.message.document.mime_type || 'application/pdf';
        originalName = ctx.message.document.file_name || 'document.pdf';
      }

      if (!fileId) {
        return ctx.reply('Please send a valid photo or PDF of your transfer receipt.');
      }

      try {
        const fileLink = await ctx.telegram.getFileLink(fileId);
        const res = await fetch(fileLink.href);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

        // Check for duplicate receipt
        const existingReceipt = await this.prisma.receipt.findUnique({
          where: { hash: fileHash },
        });

        let duplicateWarning = '';
        if (existingReceipt) {
          duplicateWarning = '\n\n⚠️ *Duplicate receipt detected.* This receipt was previously uploaded and has been flagged for admin review.';
        }

        // Save receipt
        await this.receiptsService.saveReceipt(pendingPayment.id, {
          buffer,
          mimetype: mimeType,
          originalname: originalName,
          size: buffer.length,
        } as Express.Multer.File);

        // Update receipt with telegramFileId
        await this.prisma.receipt.update({
          where: { paymentId: pendingPayment.id },
          data: { telegramFileId: fileId },
        });

        const receiptResponse =
          `📄 *RECEIPT RECEIVED*\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `Ticket:\n*#${String(pendingPayment.ticket.ticketNumber).padStart(3, '0')}*\n\n` +
          `Amount:\n*100 ETB*\n\n` +
          `Payment Method:\n*${pendingPayment.method}*\n\n` +
          `Status:\n⏳ *Pending verification*\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `An administrator will review your receipt.` +
          duplicateWarning;

        await ctx.replyWithMarkdown(receiptResponse, BotKeyboards.backToMenu());

        // Notify Admins with photo and review buttons
        for (const adminId of this.adminIds) {
          try {
            const adminCaption =
              `🔔 *NEW PAYMENT SUBMITTED*\n` +
              `━━━━━━━━━━━━━━━━━━\n\n` +
              `👤 *User:* ${pendingPayment.user.firstName || 'User'} (@${pendingPayment.user.username || 'none'})\n` +
              `🆔 *Telegram:* \`${pendingPayment.user.telegramId}\`\n` +
              `🎟 *Ticket:* #${String(pendingPayment.ticket.ticketNumber).padStart(3, '0')}\n` +
              `💰 *Amount:* 100 ETB\n` +
              `📱 *Method:* ${pendingPayment.method}\n` +
              `⏳ *Status:* PENDING` +
              (duplicateWarning ? '\n\n⚠️ *FLAG: DUPLICATE RECEIPT HASH*' : '');

            await this.bot.telegram.sendPhoto(adminId, fileId, {
              caption: adminCaption,
              parse_mode: 'Markdown',
              ...BotKeyboards.adminPaymentReview(
                pendingPayment.id,
                pendingPayment.user.id,
                pendingPayment.ticket.id
              ),
            });
          } catch (adminErr: any) {
            this.logger.warn(`Could not notify admin ${adminId}: ${adminErr.message}`);
          }
        }
      } catch (err: any) {
        return ctx.reply(`❌ Could not process receipt: ${err.message}`);
      }
    });

    // ==========================================
    // 8. User Info Screens
    // ==========================================
    this.bot.action('view_my_tickets', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const telegramId = ctx.from.id.toString();
      const tickets = await this.ticketsService.getMyTickets(telegramId);

      if (tickets.length === 0) {
        return ctx.editMessageText(
          `🎟 *MY TICKETS*\n━━━━━━━━━━━━━━━━━━\n\nYou do not have any tickets yet. Choose a number to enter the draw!`,
          {
            parse_mode: 'Markdown',
            ...BotKeyboards.mainMenu(),
          }
        );
      }

      let text = `🎟 *MY TICKETS*\n━━━━━━━━━━━━━━━━━━\n\n`;
      for (const t of tickets) {
        const statusBadge =
          t.status === TicketStatus.CONFIRMED
            ? '✅ Confirmed'
            : t.status === TicketStatus.RESERVED
              ? '⏳ Awaiting Payment'
              : t.status;

        text +=
          `• *Ticket #${String(t.ticketNumber).padStart(3, '0')}*\n` +
          `  Round: #${t.round.roundNumber}\n` +
          `  Status: ${statusBadge}\n` +
          `  Entry: ${t.round.ticketPrice} ETB\n\n`;
      }
      text += `Good luck! 🍀`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.backToMenuWithRefresh('view_my_tickets'),
      });
    });

    this.bot.action('view_payment_status', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const telegramId = ctx.from.id.toString();
      const payments = await this.prisma.payment.findMany({
        where: { user: { telegramId } },
        include: { ticket: { include: { round: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (payments.length === 0) {
        return ctx.editMessageText(
          `💳 *PAYMENT STATUS*\n━━━━━━━━━━━━━━━━━━\n\nNo payments recorded yet.`,
          {
            parse_mode: 'Markdown',
            ...BotKeyboards.backToMenu(),
          }
        );
      }

      let text = `💳 *PAYMENT STATUS*\n━━━━━━━━━━━━━━━━━━\n\n`;
      for (const p of payments) {
        const badge =
          p.status === PaymentStatus.APPROVED
            ? '✅ Approved'
            : p.status === PaymentStatus.PENDING
              ? '⏳ Pending Review'
              : `❌ Rejected (${p.rejectionReason || 'Invalid'})`;

        text +=
          `• Ticket *#${String(p.ticket.ticketNumber).padStart(3, '0')}*\n` +
          `  Amount: ${p.amount} ETB (${p.method})\n` +
          `  Status: ${badge}\n` +
          `  Date: ${p.createdAt.toLocaleDateString()}\n\n`;
      }

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.backToMenuWithRefresh('view_payment_status'),
      });
    });

    this.bot.action('view_winners', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const rounds = await this.prisma.lotteryRound.findMany({
        where: { status: RoundStatus.COMPLETED },
        include: { winners: { include: { ticket: true } } },
        orderBy: { roundNumber: 'desc' },
        take: 5,
      });

      if (rounds.length === 0) {
        return ctx.editMessageText(
          `🏆 *PREVIOUS WINNERS*\n━━━━━━━━━━━━━━━━━━\n\nNo draws completed yet. First live draw is coming soon!`,
          {
            parse_mode: 'Markdown',
            ...BotKeyboards.backToMenu(),
          }
        );
      }

      let text = `🏆 *PREVIOUS WINNERS*\n━━━━━━━━━━━━━━━━━━\n\n`;
      for (const r of rounds) {
        text += `*Round #${String(r.roundNumber).padStart(3, '0')}*\n`;
        const first = r.winners.find((w) => w.position === WinnerPosition.FIRST_PRIZE);
        const second = r.winners.find((w) => w.position === WinnerPosition.SECOND_PRIZE);
        const third = r.winners.find((w) => w.position === WinnerPosition.THIRD_PRIZE);

        if (first) text += `🥇 #${String(first.ticket.ticketNumber).padStart(3, '0')} — ${first.prizeAmount.toLocaleString()} ETB\n`;
        if (second) text += `🥈 #${String(second.ticket.ticketNumber).padStart(3, '0')} — ${second.prizeAmount.toLocaleString()} ETB\n`;
        if (third) text += `🥉 #${String(third.ticket.ticketNumber).padStart(3, '0')} — ${third.prizeAmount.toLocaleString()} ETB\n`;
        text += `━━━━━━━━━━━━━━━━━━\n\n`;
      }

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.backToMenu(),
      });
    });

    this.bot.action('view_how_it_works', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const text =
        `📖 *HOW IT WORKS (5 Easy Steps)*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `1️⃣ *Choose your number* from 1 to 200.\n` +
        `2️⃣ *Pay 100 ETB* via CBE Bank or Telebirr.\n` +
        `3️⃣ *Upload your payment receipt* directly to this chat.\n` +
        `4️⃣ *Admin verifies receipt* and confirms your ticket.\n` +
        `5️⃣ *Enter live draw* for 10,000 ETB top prize when full!\n\n` +
        `All draws use cryptographically secure random selection with permanent public records.`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.backToMenu(),
      });
    });

    this.bot.action('view_rules', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const text =
        `📜 *YALFAL ONLINE ETA RULES*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `1️⃣ Entry costs 100 ETB per number.\n` +
        `2️⃣ Numbers range from 1–200 per round.\n` +
        `3️⃣ A number can only be assigned once per round.\n` +
        `4️⃣ Payment must be verified before the ticket is eligible.\n` +
        `5️⃣ Winners are selected only from eligible confirmed tickets.\n` +
        `6️⃣ Three prizes are awarded:\n` +
        `   🥇 10,000 ETB\n` +
        `   🥈 1,000 ETB\n` +
        `   🥉 500 ETB\n` +
        `7️⃣ The same ticket cannot win more than one prize.\n` +
        `8️⃣ Draw results are cryptographically verified and immutable.\n` +
        `9️⃣ Keep your payment receipt until the draw finishes.\n` +
        `🔟 Unconfirmed tickets are returned to the pool after the payment window.`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.backToMenu(),
      });
    });

    this.bot.action('view_support', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}

      const settingPhone = await this.prisma.systemSetting.findUnique({
        where: { key: 'SUPPORT_PHONE' },
      });
      const settingTg = await this.prisma.systemSetting.findUnique({
        where: { key: 'SUPPORT_TELEGRAM' },
      });

      const phone = settingPhone?.value || '+251 91 100 0000';
      const tg = settingTg?.value || '@YalfalSupport';

      const text =
        `📞 *CUSTOMER SUPPORT*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Need help or have questions?\n\n` +
        `• *Telegram Support:* ${tg}\n` +
        `• *Phone:* \`${phone}\`\n` +
        `• *Working Hours:* 24/7 Ethiopian Time\n\n` +
        `Our support team is always ready to assist you.`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.backToMenu(),
      });
    });

    // ==========================================
    // 9. ADMIN PANEL & COMMANDS
    // ==========================================
    this.bot.command('admin', async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) {
        return ctx.reply('⛔ You don\'t have permission to access this area.');
      }

      const text =
        `🛠 *YALFAL ADMIN PANEL*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Welcome Administrator. Choose an action:`;

      return ctx.replyWithMarkdown(text, BotKeyboards.adminMainMenu());
    });

    this.bot.action('adm_dashboard', async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) {
        return ctx.answerCbQuery('Unauthorized', { show_alert: true });
      }

      const stats = await this.paymentsService.getDashboardStats();
      const currentRound = await this.prisma.lotteryRound.findFirst({
        where: { status: { in: [RoundStatus.OPEN, RoundStatus.FULL, RoundStatus.DRAWING] } },
        orderBy: { roundNumber: 'desc' },
      });

      const text =
        `📊 *ADMIN DASHBOARD*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🎡 *Current Round:*\n#${String(stats.currentRound || 1).padStart(3, '0')}\n\n` +
        `🎟 *Tickets:*\n${stats.ticketsSold} / 200\n\n` +
        `💰 *Approved Revenue:*\n${stats.totalRevenue.toLocaleString()} ETB\n\n` +
        `⏳ *Pending Payments:*\n${stats.pendingPayments}\n\n` +
        `👥 *Participants:*\n${stats.totalUsers}\n\n` +
        `🏆 *Draw Status:*\n${currentRound ? currentRound.status : 'NO ACTIVE ROUND'}`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.adminMainMenu(),
      });
    });

    this.bot.action('adm_pending_payments', async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) {
        return ctx.answerCbQuery('Unauthorized', { show_alert: true });
      }

      const pendings = await this.prisma.payment.findMany({
        where: { status: PaymentStatus.PENDING },
        include: { user: true, ticket: true, receipt: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
      });

      if (pendings.length === 0) {
        return ctx.editMessageText(
          `💳 *PENDING PAYMENTS*\n━━━━━━━━━━━━━━━━━━\n\nNo pending payments to review at this time.`,
          {
            parse_mode: 'Markdown',
            ...BotKeyboards.adminMainMenu(),
          }
        );
      }

      let text = `💳 *PENDING PAYMENTS (${pendings.length})*\n━━━━━━━━━━━━━━━━━━\n\n`;
      for (const p of pendings) {
        text +=
          `• *Ticket #${String(p.ticket.ticketNumber).padStart(3, '0')}* | ${p.amount} ETB (${p.method})\n` +
          `  User: @${p.user.username || 'none'} (${p.user.telegramId})\n` +
          `  Action: /review_${p.id}\n\n`;
      }

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.adminMainMenu(),
      });
    });

    // Handle /review_<id>
    this.bot.hears(/^\/review_(.+)$/, async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) return;

      const paymentId = ctx.match[1];
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { user: true, ticket: true, receipt: true },
      });

      if (!payment) return ctx.reply('Payment not found.');

      const caption =
        `💳 *REVIEW PAYMENT*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `• *Ticket:* #${String(payment.ticket.ticketNumber).padStart(3, '0')}\n` +
        `• *Amount:* ${payment.amount} ETB\n` +
        `• *Method:* ${payment.method}\n` +
        `• *User:* @${payment.user.username || 'none'} (${payment.user.telegramId})\n` +
        `• *Status:* ${payment.status}`;

      if (payment.receipt?.telegramFileId) {
        return ctx.replyWithPhoto(payment.receipt.telegramFileId, {
          caption,
          parse_mode: 'Markdown',
          ...BotKeyboards.adminPaymentReview(payment.id, payment.user.id, payment.ticket.id),
        });
      } else {
        return ctx.replyWithMarkdown(
          caption,
          BotKeyboards.adminPaymentReview(payment.id, payment.user.id, payment.ticket.id)
        );
      }
    });

    // ==========================================
    // 10. Admin Payment Approval & Rejection
    // ==========================================
    this.bot.action(/adm_appr_(.+)/, async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) {
        return ctx.answerCbQuery('Unauthorized', { show_alert: true });
      }

      const paymentId = ctx.match[1];

      try {
        const payment = await this.paymentsService.reviewPayment(
          paymentId,
          { status: PaymentStatus.APPROVED },
          fromId
        );

        await ctx.editMessageCaption(
          `✅ *PAYMENT APPROVED*\nTicket #${payment.ticket?.ticketNumber} is officially confirmed.`,
          { parse_mode: 'Markdown' }
        );

        // Notify User
        if (payment.user?.telegramId) {
          try {
            await this.bot.telegram.sendMessage(
              payment.user.telegramId,
              `🎉 *PAYMENT APPROVED!*\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `Your entry has been confirmed.\n\n` +
                `🎟 *Lucky Number:*\n#${String(payment.ticket?.ticketNumber).padStart(3, '0')}\n\n` +
                `💰 *Paid:*\n100 ETB\n\n` +
                `🎡 *Round:*\n#${String(payment.ticket?.roundId ? 1 : 1).padStart(3, '0')}\n\n` +
                `━━━━━━━━━━━━━━━━━━\n\n` +
                `Good luck! 🍀`,
              { parse_mode: 'Markdown' }
            );
          } catch (userNotifyErr) {}
        }
      } catch (err: any) {
        return ctx.reply(`Error approving payment: ${err.message}`);
      }
    });

    this.bot.action(/adm_rej_menu_(.+)/, async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) {
        return ctx.answerCbQuery('Unauthorized', { show_alert: true });
      }

      const paymentId = ctx.match[1];
      return ctx.editMessageCaption(
        `❌ *REJECT PAYMENT*\n\nWhy are you rejecting this payment?`,
        {
          parse_mode: 'Markdown',
          ...BotKeyboards.adminRejectReasons(paymentId),
        }
      );
    });

    this.bot.action(/adm_rej_act_(.+)_(.+)/, async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) {
        return ctx.answerCbQuery('Unauthorized', { show_alert: true });
      }

      const paymentId = ctx.match[1];
      const reasonRaw = ctx.match[2].replace(/_/g, ' ');

      const payment = await this.paymentsService.reviewPayment(
        paymentId,
        { status: PaymentStatus.REJECTED, rejectionReason: reasonRaw },
        fromId
      );

      await ctx.editMessageCaption(
        `❌ *PAYMENT REJECTED*\nReason: ${reasonRaw}\nTicket #${payment.ticket?.ticketNumber} released.`,
        { parse_mode: 'Markdown' }
      );

      // Notify User
      if (payment.user?.telegramId) {
        try {
          await this.bot.telegram.sendMessage(
            payment.user.telegramId,
            `❌ *PAYMENT NOT APPROVED*\n\n` +
              `Ticket: *#${String(payment.ticket?.ticketNumber).padStart(3, '0')}*\n\n` +
              `Reason:\n*${reasonRaw}*\n\n` +
              `Please contact support if you believe this was a mistake.`,
            { parse_mode: 'Markdown' }
          );
        } catch (userErr) {}
      }
    });

    // ==========================================
    // 11. Admin Lottery Management & Spin Draw
    // ==========================================
    this.bot.action('adm_lottery_menu', async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) return;

      const round = await this.prisma.lotteryRound.findFirst({
        where: { status: { in: [RoundStatus.OPEN, RoundStatus.FULL, RoundStatus.DRAWING] } },
        orderBy: { roundNumber: 'desc' },
        include: { tickets: true },
      });

      if (!round) {
        return ctx.editMessageText('No active round. Create one to begin sales.', {
          ...BotKeyboards.adminMainMenu(),
        });
      }

      const confirmed = round.tickets.filter((t) => t.status === TicketStatus.CONFIRMED).length;

      const text =
        `🎡 *LOTTERY ROUND MANAGEMENT*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Round: #${String(round.roundNumber).padStart(3, '0')}\n` +
        `Status: ${round.status}\n` +
        `Confirmed Tickets: ${confirmed} / ${round.maxTickets}\n\n` +
        `🥇 1st: 10,000 ETB\n` +
        `🥈 2nd: 1,000 ETB\n` +
        `🥉 3rd: 500 ETB`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🎡 START DRAW', `adm_draw_prompt_${round.id}`)],
          [Markup.button.callback('⬅️ Back to Admin', 'adm_dashboard')],
        ]),
      });
    });

    this.bot.action(/adm_draw_prompt_(.+)/, async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) return;

      const roundId = ctx.match[1];
      const round = await this.prisma.lotteryRound.findUnique({
        where: { id: roundId },
        include: { tickets: true },
      });

      if (!round) return ctx.reply('Round not found.');

      const confirmed = round.tickets.filter((t) => t.status === TicketStatus.CONFIRMED).length;

      const text =
        `🎡 *DRAW READY*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Round: #${String(round.roundNumber).padStart(3, '0')}\n\n` +
        `Confirmed Tickets: ${confirmed} / ${round.maxTickets}\n\n` +
        `🥇 1st: 10,000 ETB\n` +
        `🥈 2nd: 1,000 ETB\n` +
        `🥉 3rd: 500 ETB\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ Starting the draw will create permanent winner records.\n\n` +
        `Continue?`;

      return ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...BotKeyboards.adminDrawConfirm(round.id),
      });
    });

    // ==========================================
    // 12. Telegram Spin Wheel Animation & CSPRNG Draw
    // ==========================================
    this.bot.action(/adm_exec_draw_(.+)/, async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.isAdmin(fromId)) return;

      const roundId = ctx.match[1];
      await ctx.editMessageText('🎡 *INITIALIZING SECURE DRAW ENGINE...*', {
        parse_mode: 'Markdown',
      });

      try {
        // Execute full 3-prize draw via drawsService
        const drawResult = await this.drawsService.executeFullRoundDraw(roundId, fromId);

        const w1 = drawResult.winners.find((w: any) => w.position === WinnerPosition.FIRST_PRIZE);
        const w2 = drawResult.winners.find((w: any) => w.position === WinnerPosition.SECOND_PRIZE);
        const w3 = drawResult.winners.find((w: any) => w.position === WinnerPosition.THIRD_PRIZE);

        const candidates = drawResult.eligibleTickets || [14, 31, 56, 87, 121, 142, 193];

        // --- STEP 1: Spinning for 1st Prize ---
        await ctx.editMessageText(
          `🎡 *SPINNING FOR 1ST PRIZE...*\n\n🥇 *10,000 ETB*\n━━━━━━━━━━━━━━━━━━\n\n🔵 #014`,
          { parse_mode: 'Markdown' }
        );
        await sleep(600);

        await ctx.editMessageText(
          `🎡 *SPINNING FOR 1ST PRIZE...*\n\n🥇 *10,000 ETB*\n━━━━━━━━━━━━━━━━━━\n\n🔵 #014\n🔵 #087`,
          { parse_mode: 'Markdown' }
        );
        await sleep(600);

        await ctx.editMessageText(
          `🎡 *SPINNING FOR 1ST PRIZE...*\n\n🥇 *10,000 ETB*\n━━━━━━━━━━━━━━━━━━\n\n🔵 #014\n🔵 #087\n🔵 #142`,
          { parse_mode: 'Markdown' }
        );
        await sleep(700);

        const t1Num = String(w1.ticket.ticketNumber).padStart(3, '0');
        await ctx.editMessageText(
          `✨ *WINNER FOR 1ST PRIZE* ✨\n\n` +
            `🥇 *#${t1Num}*\n` +
            `💰 *10,000 ETB*\n\n` +
            `Congratulations! 🎉`,
          { parse_mode: 'Markdown' }
        );
        await sleep(1500);

        // --- STEP 2: Spinning for 2nd Prize ---
        await ctx.replyWithMarkdown(
          `🎡 *SPINNING FOR 2ND PRIZE...*\n\n🥈 *1,000 ETB*\n━━━━━━━━━━━━━━━━━━\n\n🔵 #031\n🔵 #121`
        );
        await sleep(700);

        const t2Num = String(w2.ticket.ticketNumber).padStart(3, '0');
        await ctx.replyWithMarkdown(
          `✨ *WINNER FOR 2ND PRIZE* ✨\n\n` +
            `🥈 *#${t2Num}*\n` +
            `💰 *1,000 ETB*\n\n` +
            `Congratulations! 🎉`
        );
        await sleep(1500);

        // --- STEP 3: Spinning for 3rd Prize ---
        await ctx.replyWithMarkdown(
          `🎡 *SPINNING FOR 3RD PRIZE...*\n\n🥉 *500 ETB*\n━━━━━━━━━━━━━━━━━━\n\n🔵 #056\n🔵 #193`
        );
        await sleep(700);

        const t3Num = String(w3.ticket.ticketNumber).padStart(3, '0');
        await ctx.replyWithMarkdown(
          `✨ *WINNER FOR 3RD PRIZE* ✨\n\n` +
            `🥉 *#${t3Num}*\n` +
            `💰 *500 ETB*\n\n` +
            `Congratulations! 🎉`
        );
        await sleep(1200);

        // --- FINAL GRAND ANNOUNCEMENT ---
        const grandAnnouncement =
          `🏆 *YALFAL ONLINE ETA*\n` +
          `🎉 *DRAW COMPLETED* 🎉\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `ROUND #${String(drawResult.round.roundNumber).padStart(3, '0')}\n\n` +
          `🥇 *1ST PRIZE*\n🎟 #${t1Num}\n💰 10,000 ETB\n\n` +
          `🥈 *2ND PRIZE*\n🎟 #${t2Num}\n💰 1,000 ETB\n\n` +
          `🥉 *3RD PRIZE*\n🎟 #${t3Num}\n💰 500 ETB\n\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `Congratulations to all winners! 🎉\n` +
          `Thank you for participating. 🍀`;

        await ctx.replyWithMarkdown(grandAnnouncement, BotKeyboards.adminMainMenu());

        // Send private notifications to winners
        const winnersList = [
          { winner: w1, position: '1st Prize', prize: '10,000 ETB' },
          { winner: w2, position: '2nd Prize', prize: '1,000 ETB' },
          { winner: w3, position: '3rd Prize', prize: '500 ETB' },
        ];

        for (const item of winnersList) {
          const u = item.winner.ticket.user;
          if (u?.telegramId) {
            try {
              await this.bot.telegram.sendMessage(
                u.telegramId,
                `🎉 *CONGRATULATIONS!*\n\n` +
                  `YOU WON!\n\n` +
                  `━━━━━━━━━━━━━━━━━━\n\n` +
                  `🏆 *Position:*\n${item.position}\n\n` +
                  `🎟 *Number:*\n#${String(item.winner.ticket.ticketNumber).padStart(3, '0')}\n\n` +
                  `💰 *Prize:*\n${item.prize}\n\n` +
                  `🎡 *Round:*\n#${String(drawResult.round.roundNumber).padStart(3, '0')}\n\n` +
                  `━━━━━━━━━━━━━━━━━━\n\n` +
                  `Please contact the administrator for prize-claim instructions.`,
                { parse_mode: 'Markdown' }
              );
            } catch (err) {}
          }
        }
      } catch (drawErr: any) {
        return ctx.reply(`❌ Draw execution failed: ${drawErr.message}`);
      }
    });

    // Fallback callback query handler
    this.bot.action('noop', async (ctx) => {
      try {
        await ctx.answerCbQuery();
      } catch (e) {}
    });
  }

  async handleWebhookUpdate(update: any) {
    if (this.bot) {
      await this.bot.handleUpdate(update);
    }
  }
}
