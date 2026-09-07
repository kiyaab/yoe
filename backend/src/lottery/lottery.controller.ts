import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LotteryService } from './lottery.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole, RoundStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('lottery')
@Controller('lottery')
export class LotteryController {
  constructor(private readonly lotteryService: LotteryService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current active draw with live ticket statistics' })
  async getCurrentRound() {
    return this.lotteryService.getCurrentRound();
  }

  @Get('rounds')
  @ApiOperation({ summary: 'List all lottery rounds (optionally filtered by status)' })
  async findAll(@Query('status') status?: RoundStatus) {
    return this.lotteryService.findAll(status);
  }

  @Get('rounds/:id')
  @ApiOperation({ summary: 'Get details for a specific lottery round' })
  async findOne(@Param('id') id: string) {
    return this.lotteryService.findOne(id);
  }

  @Post('rounds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new lottery round with 200 pre-populated tickets' })
  async create(@Body() dto: CreateRoundDto, @CurrentUser() admin: any) {
    return this.lotteryService.create(dto, admin.id);
  }

  @Patch('rounds/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update round status (OPEN, PAUSED, CLOSED, CANCELLED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRoundDto,
    @CurrentUser() admin: any,
  ) {
    return this.lotteryService.updateStatus(id, dto.status, admin.id);
  }
}
