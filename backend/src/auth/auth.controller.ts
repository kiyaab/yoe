import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate administrative staff for dashboard' })
  @ApiResponse({ status: 200, description: 'JWT session successfully created' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.validateAdmin(dto);
  }

  @Post('user/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new web user with Ethiopian phone and password' })
  @ApiResponse({ status: 201, description: 'User account created and JWT issued' })
  @ApiResponse({ status: 409, description: 'Phone number already registered' })
  async userRegister(@Body() dto: UserRegisterDto) {
    return this.authService.registerWebUser(dto);
  }

  @Post('user/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate web user via phone number or Telegram handle' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT and user profile' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async userLogin(@Body() dto: UserLoginDto) {
    return this.authService.loginWebUser(dto);
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated web user profile with tickets' })
  async getUserProfile(@CurrentUser() user: any) {
    return this.authService.getWebUserProfile(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated identity (Admin or User)' })
  async getProfile(@CurrentUser() user: any) {
    return { user };
  }
}
