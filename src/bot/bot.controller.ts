import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { BotService } from './bot.service';

@Controller('telegram')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get('status')
  getStatus() {
    return this.botService.getStatus();
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() update: any,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string
  ) {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret && secretToken !== expectedSecret) {
      return { status: 'unauthorized' };
    }
    await this.botService.handleWebhookUpdate(update);
    return { status: 'ok' };
  }
}
