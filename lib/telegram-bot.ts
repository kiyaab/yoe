import { Telegraf, Markup } from 'telegraf';
import { prisma } from './prisma';

const token = process.env.TELEGRAM_BOT_TOKEN;

let bot: Telegraf | null = null;

export function getTelegramBot(): Telegraf | null {
  if (!token) return null;
  if (!bot) {
    bot = new Telegraf(token);

    bot.start(async (ctx) => {
      const from = ctx.from;
      if (!from) return;

      // Auto-register / upsert user in database
      try {
        await prisma.user.upsert({
          where: { telegramId: from.id.toString() },
          create: {
            telegramId: from.id.toString(),
            username: from.username || null,
            firstName: from.first_name || null,
            lastName: from.last_name || null,
          },
          update: {
            username: from.username || null,
            firstName: from.first_name || null,
            lastName: from.last_name || null,
          },
        });
      } catch (err) {
        console.error('Failed to upsert telegram user:', err);
      }

      const domain = process.env.TELEGRAM_WEBHOOK_DOMAIN || process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';
      const webAppUrl = domain.startsWith('http') ? domain : `https://${domain}`;

      const welcomeText =
        `🎡 *WELCOME TO YALFAL ONLINE ETA*\n` +
        `_“Your Number. Your Chance. Your Moment.”_\n\n` +
        `🏆 *ROUND PRIZE POOL (200 Numbers / 100 ETB):*\n` +
        `🥇 *1st Prize:* 10,000 ETB\n` +
        `🥈 *2nd Prize:* 1,000 ETB\n` +
        `🥉 *3rd Prize:* 500 ETB\n\n` +
        `✨ Tap the button below to launch the *Yalfal Lottery Mini App*, pick your lucky numbers (1–200), and upload your CBE/Telebirr receipt!`;

      // Mini App Button + Direct Browser link
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.webApp('🎡 Launch Lottery Mini App', webAppUrl)],
        [Markup.button.url('🌐 Open in Web Browser', webAppUrl)],
        [
          Markup.button.callback('📊 Active Round', 'status'),
          Markup.button.callback('📞 Support', 'support'),
        ],
      ]);

      await ctx.replyWithMarkdown(welcomeText, keyboard);
    });

    bot.action('status', async (ctx) => {
      try {
        const round = await prisma.lotteryRound.findFirst({
          where: { status: 'OPEN' },
          include: { tickets: true },
        });

        if (!round) {
          await ctx.reply('No active lottery round currently open. Check back soon!');
          return;
        }

        const sold = round.tickets.filter((t) => t.status === 'CONFIRMED').length;
        const reserved = round.tickets.filter((t) => t.status === 'RESERVED').length;
        const available = 200 - sold - reserved;

        await ctx.replyWithMarkdown(
          `📊 *ROUND #${round.roundNumber} STATUS*\n\n` +
          `• Total Numbers: *200*\n` +
          `• 🟢 Available: *${available}*\n` +
          `• 🟡 Pending Verification: *${reserved}*\n` +
          `• 🔴 Confirmed Sold: *${sold}*\n` +
          `• Entry Fee: *100 ETB*`
        );
      } catch {
        await ctx.reply('Could not fetch round status at the moment.');
      }
    });

    bot.action('support', async (ctx) => {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'SUPPORT_TELEGRAM' } }).catch(() => null);
      const contact = setting?.value || '@yalfalsupport';
      await ctx.reply(`📞 Need assistance? Contact our official support team at ${contact}`);
    });
  }

  return bot;
}
