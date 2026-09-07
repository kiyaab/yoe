import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Telegraf, Markup } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { PaymentsService } from '../payments/payments.service';
import { ReceiptsService } from '../receipts/receipts.service';
import {
  PaymentMethodCode,
  PaymentStatus,
  RoundStatus,
  TicketStatus,
  NotificationStatus,
} from '@prisma/client';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;
  private readonly logger = new Logger(TelegramService.name);
  private adminIds: string[] = [];

  constructor(
    private prisma: PrismaService,
    private ticketsService: TicketsService,
    private paymentsService: PaymentsService,
    private receiptsService: ReceiptsService
  ) {}

  private isRunning = false;
  private botInfo: any = null;
  private miniAppUrl: string = process.env.TELEGRAM_MINI_APP_URL || 'https://bufing-deeper-optimal-phys.trycloudflare.com';

  async onModuleInit() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const adminIdsEnv = process.env.TELEGRAM_ADMIN_IDS || '';
    this.adminIds = adminIdsEnv.split(',').map((id) => id.trim());

    if (token && !token.includes('FakeToken')) {
      await this.startBotInstance(token);
    } else {
      this.logger.warn(
        '⚠️ TELEGRAM_BOT_TOKEN is using a placeholder. Paste your real token from @BotFather in Admin Settings or backend/.env to connect.'
      );
    }
  }

  async setMiniAppUrl(url: string) {
    this.miniAppUrl = url.trim();
    process.env.TELEGRAM_MINI_APP_URL = this.miniAppUrl;
    if (this.bot && this.miniAppUrl.startsWith('https://')) {
      try {
        await this.bot.telegram.setChatMenuButton({
          menuButton: {
            type: 'web_app',
            text: '🎡 Open Mini App',
            web_app: { url: `${this.miniAppUrl.replace(/\/$/, '')}/tickets` },
          },
        });
        this.logger.log(`📱 Telegram Mini App Menu Button configured with: ${this.miniAppUrl}/tickets`);
      } catch (err: any) {
        this.logger.warn(`Could not set chat menu button: ${err.message}`);
      }
    }
    return { success: true, miniAppUrl: this.miniAppUrl };
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

      // Configure Telegram chat menu button automatically if Mini App URL is available
      if (this.miniAppUrl && this.miniAppUrl.startsWith('https://')) {
        try {
          await this.bot.telegram.setChatMenuButton({
            menuButton: {
              type: 'web_app',
              text: '🎡 Open Mini App',
              web_app: { url: `${this.miniAppUrl.replace(/\/$/, '')}/tickets` },
            },
          });
          this.logger.log(`📱 Telegram Chat Menu Button initialized to ${this.miniAppUrl}/tickets`);
        } catch (menuErr: any) {
          this.logger.warn(`Could not set menu button on launch: ${menuErr.message}`);
        }
      }

      const botMode = process.env.TELEGRAM_BOT_MODE || 'polling';
      if (botMode === 'polling') {
        this.bot.launch().catch((err) => {
          this.logger.error('Telegram bot polling error:', err);
          this.isRunning = false;
        });
        this.isRunning = true;
        this.logger.log('🤖 Telegram Bot launched in Long Polling mode');
      }
      return { success: true, bot: this.botInfo };
    } catch (err: any) {
      this.logger.error(`Failed to connect Telegram bot with provided token: ${err.message}`);
      this.isRunning = false;
      return { success: false, error: err.message };
    }
  }

  getStatus() {
    return {
      connected: this.isRunning,
      botUsername: this.botInfo?.username || process.env.TELEGRAM_BOT_USERNAME || 'yalfalonlinebot',
      botName: this.botInfo?.first_name || 'Yalfal Online Eta',
      mode: process.env.TELEGRAM_BOT_MODE || 'polling',
      tokenSet: !!(process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_BOT_TOKEN.includes('FakeToken')),
      miniAppUrl: this.miniAppUrl,
    };
  }

  private registerHandlers() {
    // 1. /start command
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
        `🎡 *Welcome to Yalfal Online Eta!*\n\n` +
        `_“Your Number. Your Chance. Your Moment.”_\n\n` +
        `🎟 *Ticket Price:* 100 ETB / Number\n` +
        `🏆 *Prizes:*\n` +
        `🥇 *1st Prize:* 10,000 ETB\n` +
        `🥈 *2nd Prize:* 1,000 ETB\n` +
        `🥉 *3rd Prize:* 500 ETB\n\n` +
        `Numbers: *1–200*\n` +
        `Choose your lucky number below to enter the live draw!`;

      const miniAppUrl = this.miniAppUrl || process.env.TELEGRAM_MINI_APP_URL || 'https://bufing-deeper-optimal-phys.trycloudflare.com';

      const keyboard: any[] = [];
      if (miniAppUrl && miniAppUrl.startsWith('https://')) {
        keyboard.push([Markup.button.webApp('🚀 Launch Yalfal Mini App', `${miniAppUrl.replace(/\/$/, '')}/tickets`)]);
      }
      keyboard.push([Markup.button.callback('🎟 Buy Number (In Chat)', 'buy_page_0')]);
      keyboard.push([
        Markup.button.callback('🎡 Current Draw', 'view_current_draw'),
        Markup.button.callback('📋 My Ticket', 'view_my_tickets'),
      ]);
      keyboard.push([
        Markup.button.callback('💳 Payment', 'view_payment_methods'),
        Markup.button.callback('🏆 Winners', 'view_winners'),
      ]);
      keyboard.push([
        Markup.button.callback('📖 How It Works', 'view_how_it_works'),
        Markup.button.callback('📞 Support', 'view_support'),
      ]);

      return ctx.replyWithMarkdown(welcomeText, Markup.inlineKeyboard(keyboard));
    });

    // 2. Buy Number Pagination
    this.bot.action(/buy_page_(\d+)/, async (ctx) => {
      const page = parseInt(ctx.match[1], 10);
      const pageSize = 20; // 20 buttons per page for mobile ergonomics
      const startNum = page * pageSize + 1;
      const endNum = Math.min(200, startNum + pageSize - 1);

      const activeRound = await this.prisma.lotteryRound.findFirst({
        where: { status: RoundStatus.OPEN },
        orderBy: { roundNumber: 'desc' },
        include: { tickets: true },
      });

      if (!activeRound) {
        return ctx.reply('No active lottery round is open right now. Please check back soon!');
      }

      const ticketsMap = new Map(activeRound.tickets.map((t) => [t.ticketNumber, t.status]));

      const rows = [];
      let currentRow = [];

      for (let i = startNum; i <= endNum; i++) {
        const status = ticketsMap.get(i);
        const isAvailable = status === TicketStatus.AVAILABLE;
        const label = isAvailable ? `${String(i).padStart(2, '0')}` : `❌${i}`;
        const callbackData = isAvailable ? `pick_num_${i}` : `num_taken_${i}`;

        currentRow.push(Markup.button.callback(label, callbackData));
        if (currentRow.length === 5) {
          rows.push(currentRow);
          currentRow = [];
        }
      }
      if (currentRow.length > 0) rows.push(currentRow);

      // Pagination navigation buttons
      const navButtons = [];
      if (page > 0) {
        navButtons.push(Markup.button.callback('⬅ Previous', `buy_page_${page - 1}`));
      }
      if (endNum < 200) {
        navButtons.push(Markup.button.callback('Next ➡', `buy_page_${page + 1}`));
      }
      if (navButtons.length > 0) rows.push(navButtons);

      await ctx.editMessageText(
        `🎟 *Choose Your Lucky Number (Numbers ${startNum}–${endNum})*\n\n` +
          `• Click an available number to reserve it.\n` +
          `• Numbers marked with ❌ are already taken.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(rows),
        }
      );
    });

    // 3. Select Number
    this.bot.action(/pick_num_(\d+)/, async (ctx) => {
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

        return ctx.replyWithMarkdown(
          `🎟 *YOUR NUMBER #087 RESERVED!* (Number *#${String(num).padStart(3, '0')}*)\n\n` +
            `• *Entry Fee:* 100 ETB\n` +
            `• *Round:* #${ticket.round.roundNumber}\n` +
            `• *Status:* ⏳ Awaiting Payment\n\n` +
            `Please choose your payment method:`,
          Markup.inlineKeyboard([
            [
              Markup.button.callback('🏦 CBE Bank', `pay_cbe_${ticket.id}`),
              Markup.button.callback('📱 Telebirr', `pay_telebirr_${ticket.id}`),
            ],
            [Markup.button.callback('❌ Cancel Selection', `cancel_res_${ticket.id}`)],
          ])
        );
      } catch (err) {
        return ctx.reply(err.message || 'Could not reserve this number. Please choose another.');
      }
    });

    // 4. Payment method details
    this.bot.action(/pay_(cbe|telebirr)_(.+)/, async (ctx) => {
      const methodCode = ctx.match[1].toUpperCase() as PaymentMethodCode;
      const ticketId = ctx.match[2];

      const method = await this.prisma.paymentMethod.findUnique({
        where: { code: methodCode },
      });

      if (!method) {
        return ctx.reply('Payment method temporarily unavailable.');
      }

      // Initialize or update payment record
      await this.paymentsService.createPayment({
        ticketId,
        method: methodCode,
        amount: 100.0,
      });

      const message =
        `💳 *${method.code === 'CBE' ? 'Commercial Bank of Ethiopia (CBE)' : 'Telebirr'} Instructions*\n\n` +
        `• *Account Name:* ${method.accountName}\n` +
        `• *${method.code === 'CBE' ? 'Account Number' : 'Phone Number'}:* \`${method.accountNumber}\` (Tap to copy)\n` +
        `• *Amount to Pay:* *100 ETB*\n\n` +
        `📝 *Next Step:*\n` +
        `After completing the transfer, *reply to this bot with a screenshot or PDF receipt*.\n\n` +
        `Your ticket will be permanently confirmed as soon as the admin verifies your receipt.`;

      return ctx.replyWithMarkdown(message);
    });

    // 5. Handling uploaded photo / document receipts
    this.bot.on(['photo', 'document'], async (ctx) => {
      const telegramId = ctx.from.id.toString();

      // Find user's latest pending payment ticket
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
          'ℹ You do not have an active ticket awaiting payment. Please use /start and choose a number first!'
        );
      }

      let fileId = '';
      let mimeType = 'image/jpeg';
      let originalName = 'telegram_receipt.jpg';

      if ('photo' in ctx.message && ctx.message.photo.length > 0) {
        const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];
        fileId = largestPhoto.file_id;
      } else if ('document' in ctx.message) {
        fileId = ctx.message.document.file_id;
        mimeType = ctx.message.document.mime_type || 'application/pdf';
        originalName = ctx.message.document.file_name || 'document.pdf';
      }

      if (!fileId) {
        return ctx.reply('Please send a valid image or PDF receipt.');
      }

      try {
        const fileLink = await ctx.telegram.getFileLink(fileId);
        const response = await fetch(fileLink.href);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await this.receiptsService.saveReceipt(pendingPayment.id, {
          buffer,
          mimetype: mimeType,
          originalname: originalName,
          size: buffer.length,
        } as Express.Multer.File);

        await ctx.replyWithMarkdown(
          `📄 *Receipt received!*\n\n` +
            `• *Ticket:* #${String(pendingPayment.ticket.ticketNumber).padStart(3, '0')}\n` +
            `• *Payment:* 100 ETB (${pendingPayment.method})\n` +
            `• *Status:* ⏳ *Waiting for verification*\n\n` +
            `We will notify you here as soon as an administrator verifies your payment.`
        );

        // Notify Admins on Telegram
        for (const adminId of this.adminIds) {
          try {
            await this.bot.telegram.sendMessage(
              adminId,
              `🔔 *NEW PAYMENT RECEIPT SUBMITTED*\n\n` +
                `• *User:* @${pendingPayment.user.username || pendingPayment.user.firstName} (ID: ${pendingPayment.user.telegramId})\n` +
                `• *Ticket:* #${String(pendingPayment.ticket.ticketNumber).padStart(3, '0')}\n` +
                `• *Amount:* 100 ETB\n` +
                `• *Method:* ${pendingPayment.method}\n` +
                `• *Reference:* \`${pendingPayment.reference}\``,
              {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                  [
                    Markup.button.callback('✅ APPROVE', `admin_appr_${pendingPayment.id}`),
                    Markup.button.callback('❌ REJECT', `admin_rej_${pendingPayment.id}`),
                  ],
                ]),
              }
            );
          } catch (adminSendErr) {
            this.logger.warn(`Could not notify admin ${adminId}: ${adminSendErr.message}`);
          }
        }
      } catch (err) {
        return ctx.reply(`❌ Could not process receipt: ${err.message}`);
      }
    });

    // 6. Admin Inline Actions
    this.bot.action(/admin_appr_(.+)/, async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.adminIds.includes(fromId)) {
        return ctx.answerCbQuery('Unauthorized');
      }

      const paymentId = ctx.match[1];
      try {
        const payment = await this.paymentsService.reviewPayment(
          paymentId,
          { status: PaymentStatus.APPROVED },
          'telegram-admin'
        );

        await ctx.editMessageText(
          `✅ *Payment Approved*\nTicket #${payment.ticket?.ticketNumber} confirmed.`,
          { parse_mode: 'Markdown' }
        );

        // Notify user
        if (payment.user?.telegramId) {
          await this.bot.telegram.sendMessage(
            payment.user.telegramId,
            `🎉 *PAYMENT APPROVED!*\n\n` +
              `Your ticket is confirmed!\n\n` +
              `🎟 *Lucky Number:* #${String(payment.ticket?.ticketNumber).padStart(3, '0')}\n` +
              `🏆 You are officially entered into the current draw.\n\n` +
              `Good luck! 🍀`,
            { parse_mode: 'Markdown' }
          );
        }
      } catch (err) {
        await ctx.reply(`Error approving payment: ${err.message}`);
      }
    });

    this.bot.action(/admin_rej_(.+)/, async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.adminIds.includes(fromId)) {
        return ctx.answerCbQuery('Unauthorized');
      }

      const paymentId = ctx.match[1];
      await this.paymentsService.reviewPayment(
        paymentId,
        { status: PaymentStatus.REJECTED, rejectionReason: 'Receipt unreadable or invalid' },
        'telegram-admin'
      );

      await ctx.editMessageText(`❌ *Payment Rejected*\nTicket released back to available pool.`, {
        parse_mode: 'Markdown',
      });
    });

    // 7. /admin Command
    this.bot.command('admin', async (ctx) => {
      const fromId = ctx.from.id.toString();
      if (!this.adminIds.includes(fromId)) {
        return ctx.reply('⛔ Unauthorized: You do not have administrator privileges.');
      }

      const stats = await this.paymentsService.getDashboardStats();

      const text =
        `📊 *YALFAL ONLINE ETA — ADMIN PANEL*\n\n` +
        `• *Current Round:* #${stats.currentRound || 'N/A'}\n` +
        `• *Tickets Sold:* ${stats.ticketsSold} / 200\n` +
        `• *Total Revenue:* ${stats.totalRevenue.toLocaleString()} ETB\n` +
        `• *Pending Payments:* ${stats.pendingPayments}\n` +
        `• *Available Numbers:* ${stats.availableNumbers}`;

      return ctx.replyWithMarkdown(
        text,
        Markup.inlineKeyboard([
          [
            Markup.button.callback('💳 Pending Payments', 'adm_list_pending'),
            Markup.button.callback('👥 Users', 'adm_list_users'),
          ],
          [
            Markup.button.callback('🎡 Draw Status', 'view_current_draw'),
            Markup.button.callback('🏆 Winners', 'view_winners'),
          ],
        ])
      );
    });

    // Info buttons
    this.bot.action('view_current_draw', async (ctx) => {
      const round = await this.prisma.lotteryRound.findFirst({
        where: { status: { in: [RoundStatus.OPEN, RoundStatus.FULL, RoundStatus.DRAWING] } },
        orderBy: { roundNumber: 'desc' },
      });
      if (!round) return ctx.reply('No active draw at the moment.');
      return ctx.replyWithMarkdown(
        `🎡 *CURRENT DRAW: Round #${round.roundNumber}*\n\n` +
          `• *Status:* ${round.status}\n` +
          `• *Entry Price:* ${round.ticketPrice} ETB\n` +
          `• *1st Prize:* ${round.firstPrize.toLocaleString()} ETB\n` +
          `• *2nd Prize:* ${round.secondPrize.toLocaleString()} ETB\n` +
          `• *3rd Prize:* ${round.thirdPrize.toLocaleString()} ETB`
      );
    });

    this.bot.action('view_my_tickets', async (ctx) => {
      const telegramId = ctx.from.id.toString();
      const tickets = await this.ticketsService.getMyTickets(telegramId);
      if (tickets.length === 0) {
        return ctx.reply('You do not have any tickets yet. Click "Buy Number" to join!');
      }

      let text = `📋 *YOUR TICKETS*\n\n`;
      for (const t of tickets) {
        text += `• Ticket *#${String(t.ticketNumber).padStart(3, '0')}* (Round #${t.round.roundNumber}) — Status: *${t.status}*\n`;
      }
      return ctx.replyWithMarkdown(text);
    });

    this.bot.action('view_how_it_works', (ctx) => {
      const text =
        `📖 *HOW IT WORKS (5 Steps)*\n\n` +
        `1️⃣ *Choose a number* from 1 to 200\n` +
        `2️⃣ *Pay 100 ETB* via CBE or Telebirr\n` +
        `3️⃣ *Upload payment receipt* screenshot here\n` +
        `4️⃣ *Admin verifies payment*\n` +
        `5️⃣ *Your number enters the live draw*\n\n` +
        `Draws are conducted using cryptographic random selection when all numbers are filled!`;
      return ctx.replyWithMarkdown(text);
    });

    this.bot.action('view_support', (ctx) => {
      return ctx.replyWithMarkdown(
        `📞 *CUSTOMER SUPPORT*\n\n` +
          `• Telegram: @YalfalSupport\n` +
          `• Phone: +251 91 100 0000\n` +
          `• Working Hours: 24/7 Ethiopian Time`
      );
    });
  }

  async handleWebhookUpdate(update: any) {
    if (this.bot) {
      await this.bot.handleUpdate(update);
    }
  }
}
