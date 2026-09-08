import { Telegraf, Markup } from 'telegraf';
import { prisma } from './prisma';

const token = process.env.TELEGRAM_BOT_TOKEN || '8880998246:AAFkEAPFE2Jj1ZSpn3NzqxIqrgqvJXmVacM';

let bot: Telegraf | null = null;
let isPollingActive = false;

/**
 * Resolves the primary URL used for WebApp and external links.
 * Checks TELEGRAM_MINI_APP_URL, RENDER_EXTERNAL_URL, NEXT_PUBLIC_APP_URL, FRONTEND_URL.
 */
export function getWebAppUrl(): string {
  const raw =
    process.env.TELEGRAM_MINI_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.FRONTEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.TELEGRAM_WEBHOOK_DOMAIN ||
    'https://yalfalonline.vercel.app';

  let cleaned = raw.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, '');
}

export function getTelegramBot(): Telegraf | null {
  if (!token) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN is not defined in environment variables.');
    return null;
  }

  if (bot) {
    return bot;
  }

  bot = new Telegraf(token);

  // Global error handler to ensure the bot polling never crashes on unhandled errors
  bot.catch((err: any, ctx) => {
    console.error(`🚨 Telegram Bot Error on ${ctx.updateType}:`, err?.message || err);
  });

  // Register command list in Telegram UI
  bot.telegram
    .setMyCommands([
      { command: 'start', description: '🎡 Launch Yalfal Lottery & Mini App' },
      { command: 'play', description: '🎟 Pick Lucky Numbers (1–200) for 100 ETB' },
      { command: 'buy', description: '💳 Reserve Ticket & Upload CBE/Telebirr Receipt' },
      { command: 'draw', description: '🎲 Watch Live CSPRNG Provably Fair Draw' },
      { command: 'mytickets', description: '📋 View My Reserved & Confirmed Tickets' },
      { command: 'status', description: '📊 Check Current Round Availability' },
      { command: 'help', description: 'ℹ️ Rules, Prizes & Payment Guidelines' },
      { command: 'admin', description: '🛡️ Administrator Control Dashboard' },
    ])
    .catch((err) => {
      console.warn('ℹ️ Could not set bot commands menu:', err.message);
    });

  // Handler for /start, /play, /app
  const handleStart = async (ctx: any) => {
    const from = ctx.from;
    if (!from) return;

    try {
      await prisma.user.upsert({
        where: { telegramId: from.id.toString() },
        create: {
          telegramId: from.id.toString(),
          username: from.username || null,
          firstName: from.first_name || 'Participant',
          lastName: from.last_name || null,
        },
        update: {
          username: from.username || null,
          firstName: from.first_name || 'Participant',
          lastName: from.last_name || null,
        },
      });
    } catch (err) {
      console.error('Failed to upsert telegram user:', err);
    }

    const webAppUrl = getWebAppUrl();
    const isHttps = webAppUrl.startsWith('https://');

    // Configure Telegram Chat Menu Button (Persistent bottom-left button in Telegram)
    if (isHttps) {
      bot?.telegram
        .setChatMenuButton({
          chatId: ctx.chat.id,
          menuButton: {
            type: 'web_app',
            text: '🎡 Play Lottery',
            web_app: { url: webAppUrl },
          },
        })
        .catch(() => {});
    }

    const welcomeText =
      `🎡 *WELCOME TO YALFAL ONLINE ETA*\n` +
      `_“Your Number. Your Chance. Your Moment.”_\n\n` +
      `🏆 *OFFICIAL PRIZE POOL (200 Numbers / 100 ETB Entry):*\n` +
      `🥇 *1st Prize:* 10,000 ETB\n` +
      `🥈 *2nd Prize:* 1,000 ETB\n` +
      `🥉 *3rd Prize:* 500 ETB\n\n` +
      `✨ Tap below to open the *Yalfal Lottery Mini App*, pick your lucky numbers (1–200), and upload your CBE or Telebirr payment receipt!`;

    const buttonRows: any[] = [];

    if (isHttps) {
      buttonRows.push([Markup.button.webApp('🎡 Launch Lottery Mini App', webAppUrl)]);
      buttonRows.push([Markup.button.url('🌐 Open in Web Browser', webAppUrl)]);
    } else {
      // Telegram requires HTTPS for WebApp buttons; fallback to regular browser URL
      buttonRows.push([Markup.button.url('🌐 Open Lottery WebApp', webAppUrl)]);
    }

    buttonRows.push([
      Markup.button.callback('📊 Active Round', 'status'),
      Markup.button.callback('📞 Support', 'support'),
    ]);

    await ctx.replyWithMarkdown(welcomeText, Markup.inlineKeyboard(buttonRows));
  };

  bot.start(handleStart);
  bot.command('play', handleStart);
  bot.command('app', handleStart);

  // /buy command
  bot.command('buy', async (ctx) => {
    const webAppUrl = getWebAppUrl();
    const isHttps = webAppUrl.startsWith('https://');
    const ticketsUrl = `${webAppUrl}/tickets`;

    const keyboard = isHttps
      ? Markup.inlineKeyboard([
          [Markup.button.webApp('🎟 Select Lucky Numbers (1–200)', ticketsUrl)],
          [Markup.button.url('🌐 Open in Browser', ticketsUrl)],
        ])
      : Markup.inlineKeyboard([
          [Markup.button.url('🎟 Browse Numbers (1–200)', ticketsUrl)],
        ]);

    await ctx.replyWithMarkdown(
      `🎟 *SELECT YOUR LUCKY NUMBER (1–200)*\n\n` +
      `Each number is *100 ETB*. Once selected, upload your CBE Birr or Telebirr transfer screenshot for instant admin confirmation.`,
      keyboard
    );
  });

  // /draw command
  bot.command('draw', async (ctx) => {
    const webAppUrl = getWebAppUrl();
    const isHttps = webAppUrl.startsWith('https://');
    const drawUrl = `${webAppUrl}/draw`;

    const keyboard = isHttps
      ? Markup.inlineKeyboard([
          [Markup.button.webApp('🎲 Watch Live Draw', drawUrl)],
          [Markup.button.url('🌐 Open in Browser', drawUrl)],
        ])
      : Markup.inlineKeyboard([[Markup.button.url('🎲 Watch Live Draw', drawUrl)]]);

    await ctx.replyWithMarkdown(
      `🎲 *PROVABLY FAIR LIVE DRAW*\n\n` +
      `Watch our cryptographic random number generator spin live on the interactive canvas wheel!`,
      keyboard
    );
  });

  // /mytickets command
  bot.command('mytickets', async (ctx) => {
    const webAppUrl = getWebAppUrl();
    const isHttps = webAppUrl.startsWith('https://');
    const myTicketsUrl = `${webAppUrl}/my-tickets`;

    const keyboard = isHttps
      ? Markup.inlineKeyboard([
          [Markup.button.webApp('📋 My Lottery Tickets', myTicketsUrl)],
          [Markup.button.url('🌐 Open in Browser', myTicketsUrl)],
        ])
      : Markup.inlineKeyboard([[Markup.button.url('📋 My Lottery Tickets', myTicketsUrl)]]);

    await ctx.replyWithMarkdown(
      `📋 *YOUR TICKETS & PARTICIPATION*\n\n` +
      `View your confirmed numbers, pending payment receipts, and win history.`,
      keyboard
    );
  });

  // /status command & callback
  const handleStatus = async (ctx: any) => {
    try {
      const round = await prisma.lotteryRound.findFirst({
        where: { status: 'OPEN' },
        include: { tickets: true },
      });

      if (!round) {
        await ctx.reply('ℹ️ No active lottery round currently open. Check back soon for the next round!');
        return;
      }

      const sold = round.tickets.filter((t) => t.status === 'CONFIRMED').length;
      const reserved = round.tickets.filter((t) => t.status === 'RESERVED').length;
      const available = 200 - sold - reserved;

      await ctx.replyWithMarkdown(
        `📊 *YALFAL ROUND #${round.roundNumber} STATUS*\n\n` +
        `• 🎯 Total Numbers: *200*\n` +
        `• 🟢 Available to Pick: *${available}*\n` +
        `• 🟡 Pending Verification: *${reserved}*\n` +
        `• 🔴 Confirmed Sold: *${sold}*\n` +
        `• 💵 Ticket Price: *100 ETB*\n\n` +
        `🥇 *1st Prize:* 10,000 ETB\n` +
        `🥈 *2nd Prize:* 1,000 ETB\n` +
        `🥉 *3rd Prize:* 500 ETB`
      );
    } catch (err: any) {
      console.error('Status check error:', err?.message);
      await ctx.reply('⚠️ Could not fetch round status at this time.');
    }
  };

  bot.command('status', handleStatus);
  bot.action('status', handleStatus);

  // /help command
  bot.command('help', async (ctx) => {
    await ctx.replyWithMarkdown(
      `ℹ️ *YALFAL ONLINE ETA — RULES & GUIDELINES*\n\n` +
      `1️⃣ *Select Number:* Choose any number from 1 to 200 via the Mini App.\n` +
      `2️⃣ *Pay Entry Fee:* Transfer *100 ETB* via CBE (Commercial Bank of Ethiopia) or Telebirr.\n` +
      `3️⃣ *Upload Screenshot:* Provide your transaction screenshot / ref number in the app.\n` +
      `4️⃣ *Confirmation:* Admins verify your receipt, changing your ticket to *CONFIRMED*.\n` +
      `5️⃣ *The Draw:* Once all 200 numbers are filled, the provably fair live draw executes automatically!\n\n` +
      `🏆 *Prizes:* 1st (10,000 ETB) • 2nd (1,000 ETB) • 3rd (500 ETB)\n` +
      `📞 Support: Contact @yalfalsupport for assistance.`
    );
  });

  // /support callback
  bot.action('support', async (ctx) => {
    try {
      const setting = await prisma.systemSetting
        .findUnique({ where: { key: 'SUPPORT_TELEGRAM' } })
        .catch(() => null);
      const contact = setting?.value || '@yalfalsupport';
      await ctx.reply(`📞 Need assistance? Contact our official support team at ${contact}`);
    } catch {
      await ctx.reply(`📞 Official support: @yalfalsupport`);
    }
  });

  // /admin command
  bot.command('admin', async (ctx) => {
    const fromId = ctx.from?.id?.toString();
    const adminIds = (process.env.TELEGRAM_ADMIN_IDS || '').split(',').map((s) => s.trim());

    if (!fromId || !adminIds.includes(fromId)) {
      await ctx.reply('⛔ Access denied. Your Telegram ID is not authorized for the admin suite.');
      return;
    }

    const webAppUrl = getWebAppUrl();
    const isHttps = webAppUrl.startsWith('https://');
    const adminUrl = `${webAppUrl}/admin`;

    const keyboard = isHttps
      ? Markup.inlineKeyboard([
          [Markup.button.webApp('🛡️ Open Admin Panel', adminUrl)],
          [Markup.button.url('🌐 Open Admin in Browser', adminUrl)],
        ])
      : Markup.inlineKeyboard([[Markup.button.url('🌐 Open Admin in Browser', adminUrl)]]);

    await ctx.replyWithMarkdown(
      `🛡️ *YALFAL ONLINE ETA — ADMIN SUITE*\n\n` +
      `• Review pending CBE & Telebirr receipts\n` +
      `• Confirm or reject ticket reservations\n` +
      `• Trigger Provably Fair CSPRNG Live Draw\n` +
      `• Manage lottery settings and bank accounts`,
      keyboard
    );
  });

  // Only start polling if explicitly requested and NOT during next build or migration
  const isBuildPhase =
    process.argv.some((arg) => arg.includes('build') || arg.includes('prisma')) ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build';

  const mode = process.env.TELEGRAM_BOT_MODE || (process.env.NODE_ENV === 'production' ? 'webhook' : 'polling');
  if (mode === 'polling' && !isPollingActive && !isBuildPhase && process.env.AUTO_START_POLLING === 'true') {
    startBotPolling(bot);
  }

  return bot;
}

/**
 * Starts resilient Telegram Bot long-polling with exponential backoff on reconnection
 */
export function startBotPolling(instance: Telegraf) {
  if (isPollingActive) return;
  isPollingActive = true;

  console.log('🤖 Starting Telegram Bot resilient polling daemon...');

  instance
    .launch({ dropPendingUpdates: true })
    .then(() => {
      console.log('✅ Telegram Bot polling is active and listening for updates.');
      const webAppUrl = getWebAppUrl();
      if (webAppUrl.startsWith('https://')) {
        instance.telegram
          .setChatMenuButton({
            menuButton: {
              type: 'web_app',
              text: '🎡 Play Lottery',
              web_app: { url: webAppUrl },
            },
          })
          .catch((err) => console.warn('Note on menu button:', err?.message));
      }
    })
    .catch((err) => {
      console.error('⚠️ Telegram Bot launch failed:', err?.message || err);
      isPollingActive = false;
      // Retry in 10 seconds
      setTimeout(() => {
        if (!isPollingActive && bot) {
          startBotPolling(bot);
        }
      }, 10000);
    });

  // Clean shutdown handlers
  process.once('SIGINT', () => {
    try {
      instance.stop('SIGINT');
    } catch {}
  });
  process.once('SIGTERM', () => {
    try {
      instance.stop('SIGTERM');
    } catch {}
  });
}

// Auto-initialize bot instance (without starting polling during build)
const isBuildPhase =
  process.argv.some((arg) => arg.includes('build') || arg.includes('prisma')) ||
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build';

if (token && !isBuildPhase) {
  try {
    getTelegramBot();
  } catch (err: any) {
    console.warn('Bot initial setup warning:', err?.message);
  }
}
