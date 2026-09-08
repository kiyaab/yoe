import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { ReserveTicketDto } from './dto/reserve-ticket.dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all 200 numbers for a round with availability and ownership' })
  async getTickets(
    @Query('roundId') roundId?: string,
    @Query('telegramId') telegramId?: string,
  ) {
    return this.ticketsService.getTicketsForRound(roundId, telegramId);
  }

  @Post('reserve')
  @ApiOperation({ summary: 'Atomically reserve a ticket number with concurrency protection' })
  @ApiResponse({ status: 201, description: 'Ticket reserved successfully' })
  @ApiResponse({ status: 409, description: 'Ticket number already taken' })
  async reserve(@Body() dto: ReserveTicketDto) {
    return this.ticketsService.reserveTicket(dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get all tickets belonging to a specific Telegram user' })
  async getMyTickets(@Query('telegramId') telegramId: string) {
    return this.ticketsService.getMyTickets(telegramId);
  }
}
