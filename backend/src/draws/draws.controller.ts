import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DrawsService } from './draws.service';
import { ExecuteDrawDto } from './dto/execute-draw.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('draws')
@Controller('draws')
export class DrawsController {
  constructor(private readonly drawsService: DrawsService) {}

  @Get('round/:roundId/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get confirmed eligible participants for the live wheel draw' })
  async getParticipants(@Param('roundId') roundId: string) {
    return this.drawsService.getEligibleParticipants(roundId);
  }

  @Post('execute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute cryptographically secure winner selection for a prize' })
  async executeDraw(@Body() dto: ExecuteDrawDto, @CurrentUser() admin: any) {
    return this.drawsService.executeDraw(dto, admin.id);
  }
}
