import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminRole, PaymentMethodCode } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('payment-methods/public')
  @ApiOperation({ summary: 'Get active payment accounts for user payment flow (CBE & Telebirr)' })
  async getPublicPaymentMethods() {
    return this.settingsService.getPublicPaymentMethods();
  }

  @Get('payment-methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payment methods with management details (Admin)' })
  async getAllPaymentMethods() {
    return this.settingsService.getAllPaymentMethods();
  }

  @Patch('payment-methods/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update CBE or Telebirr account information & instructions' })
  async updatePaymentMethod(
    @Param('code') code: PaymentMethodCode,
    @Body() body: { accountName?: string; accountNumber?: string; instructions?: string; isActive?: boolean },
    @CurrentUser() admin: any
  ) {
    return this.settingsService.updatePaymentMethod(code, body, admin.id);
  }

  @Get('system')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform system settings' })
  async getSystemSettings() {
    return this.settingsService.getSystemSettings();
  }

  @Patch('system/:key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update system setting key-value' })
  async updateSystemSetting(
    @Param('key') key: string,
    @Body('value') value: string,
    @CurrentUser() admin: any
  ) {
    return this.settingsService.updateSystemSetting(key, value, admin.id);
  }
}
