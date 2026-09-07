import { Controller, Get, Post, Body, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current Telegram bot live connection status' })
  getStatus() {
    return this.telegramService.getStatus();
  }

  @Post('token')
  @ApiOperation({ summary: 'Connect bot with BotFather API token' })
  async updateToken(@Body('token') token: string) {
    if (!token || token.trim().length < 20) {
      return { success: false, error: 'Invalid token format. Token must be from @BotFather' };
    }
    process.env.TELEGRAM_BOT_TOKEN = token.trim();
    return this.telegramService.startBotInstance(token.trim());
  }

  @Post('mini-app-url')
  @ApiOperation({ summary: 'Update Telegram Mini App URL and sync Telegram chat menu button' })
  async updateMiniAppUrl(@Body('url') url: string) {
    if (!url || !url.startsWith('https://')) {
      return { success: false, error: 'Mini App URL must begin with https://' };
    }
    return this.telegramService.setMiniAppUrl(url);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram bot webhook update endpoint' })
  async handleWebhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secretToken: string
  ) {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret && secretToken !== expectedSecret) {
      throw new UnauthorizedException('Invalid Telegram webhook secret token');
    }
    await this.telegramService.handleWebhookUpdate(update);
    return { ok: true };
  }
}
