import dotenv from 'dotenv';
dotenv.config();

import { getTelegramBot, getWebAppUrl, startBotPolling } from '../lib/telegram-bot';

async function main() {
  console.log('----------------------------------------------------');
  console.log('🚀 YALFAL ONLINE ETA — TELEGRAM BOT WORKER DAEMON');
  console.log('----------------------------------------------------');

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('❌ FATAL: TELEGRAM_BOT_TOKEN is not configured in .env');
    process.exit(1);
  }

  const webAppUrl = getWebAppUrl();
  console.log(`🌐 Mini App Target URL: ${webAppUrl}`);
  console.log(`🔒 HTTPS Enabled: ${webAppUrl.startsWith('https://') ? 'YES (Telegram Mini App Ready)' : 'NO (Will fallback to browser URLs)'}`);

  const bot = getTelegramBot();
  if (!bot) {
    console.error('❌ Failed to initialize Telegraf instance.');
    process.exit(1);
  }

  try {
    const me = await bot.telegram.getMe();
    console.log(`🤖 Connected to Telegram as @${me.username} (ID: ${me.id})`);

    // Ensure polling is active
    startBotPolling(bot);

    console.log('✅ Telegram Bot is running 24/7. Press Ctrl+C to terminate.');

    // Periodic heartbeat every 15 minutes
    setInterval(() => {
      console.log(`💓 [Heartbeat ${new Date().toISOString()}] Bot @${me.username} is healthy & polling.`);
    }, 15 * 60 * 1000);
  } catch (err: any) {
    console.error('❌ Error verifying bot with Telegram API:', err?.message || err);
  }
}

// Global safety catches to ensure process stays alive
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception in Bot Worker:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('🚨 Unhandled Promise Rejection in Bot Worker:', reason);
});

main();
