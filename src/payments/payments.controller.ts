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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ReviewPaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole, PaymentMethodCode, PaymentStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit payment details for a reserved ticket' })
  async create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.REVIEWER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all payments with filters (Admin)' })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: PaymentStatus,
    @Query('method') method?: PaymentMethodCode,
    @Query('search') search?: string,
  ) {
    return this.paymentsService.findAll({
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 50,
      status,
      method,
      search,
    });
  }

  @Get('dashboard-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.REVIEWER, AdminRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get administrative dashboard summary statistics' })
  async getStats() {
    return this.paymentsService.getDashboardStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.REVIEWER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment record by ID' })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.REVIEWER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a payment with mandatory rejection reason' })
  async review(
    @Param('id') id: string,
    @Body() dto: ReviewPaymentDto,
    @CurrentUser() admin: any,
  ) {
    return this.paymentsService.reviewPayment(id, dto, admin.id);
  }
}
