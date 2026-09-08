import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserLoginDto } from './dto/user-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin',
    };

    // Log admin login to audit log
    await this.prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'ADMIN_LOGIN',
        entity: 'Admin',
        entityId: admin.id,
        metadata: JSON.stringify({ email: admin.email }),
      },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
      },
    };
  }

  async registerWebUser(dto: UserRegisterDto) {
    const cleanPhone = dto.phone.replace(/[\s\-]/g, '');
    const cleanUsername = dto.telegramUsername ? dto.telegramUsername.replace(/^@/, '').trim() : null;

    // Check if user with this phone exists
    let existingUser = await this.prisma.user.findFirst({
      where: { phone: cleanPhone },
    });

    if (existingUser && existingUser.passwordHash) {
      throw new ConflictException('An account with this phone number already exists. Please log in.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    if (existingUser) {
      // Upgrade existing record (e.g. from telegram interaction) with credentials
      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: dto.firstName.trim(),
          lastName: dto.lastName ? dto.lastName.trim() : existingUser.lastName,
          username: cleanUsername || existingUser.username,
          passwordHash,
        },
      });

      const payload = {
        sub: updatedUser.id,
        phone: updatedUser.phone,
        telegramId: updatedUser.telegramId,
        type: 'user',
      };

      return {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: updatedUser.id,
          phone: updatedUser.phone,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          username: updatedUser.username,
          telegramId: updatedUser.telegramId,
          status: updatedUser.status,
        },
      };
    }

    // Determine unique telegramId identifier for web registration
    let userTelegramId = `web_${cleanPhone}`;
    if (cleanUsername) {
      const existingTg = await this.prisma.user.findUnique({
        where: { telegramId: cleanUsername },
      });
      if (!existingTg) {
        userTelegramId = cleanUsername;
      }
    }

    const newUser = await this.prisma.user.create({
      data: {
        telegramId: userTelegramId,
        phone: cleanPhone,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName ? dto.lastName.trim() : null,
        username: cleanUsername,
        passwordHash,
      },
    });

    const payload = {
      sub: newUser.id,
      phone: newUser.phone,
      telegramId: newUser.telegramId,
      type: 'user',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: newUser.id,
        phone: newUser.phone,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        telegramId: newUser.telegramId,
        status: newUser.status,
      },
    };
  }

  async loginWebUser(dto: UserLoginDto) {
    const rawId = dto.identifier.trim();
    const cleanId = rawId.replace(/[\s\-]/g, '');
    const cleanUsername = rawId.replace(/^@/, '');

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanId },
          { phone: rawId },
          { username: cleanUsername },
          { telegramId: rawId },
          { telegramId: `web_${cleanId}` },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid phone number/username or password. If you do not have an account, please register.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid phone number/username or password.');
    }

    const payload = {
      sub: user.id,
      phone: user.phone,
      telegramId: user.telegramId,
      type: 'user',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        telegramId: user.telegramId,
        status: user.status,
      },
    };
  }

  async getWebUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tickets: {
          include: { round: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const { passwordHash, ...cleanUser } = user;
    return cleanUser;
  }

  async validateTelegramUser(telegramId: string, username?: string, firstName?: string, lastName?: string) {
    let user = await this.prisma.user.findUnique({
      where: { telegramId: telegramId.toString() },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId: telegramId.toString(),
          username: username || null,
          firstName: firstName || null,
          lastName: lastName || null,
        },
      });
    } else if (username || firstName || lastName) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          username: username ?? user.username,
          firstName: firstName ?? user.firstName,
          lastName: lastName ?? user.lastName,
        },
      });
    }

    const payload = {
      sub: user.id,
      telegramId: user.telegramId,
      type: 'user',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
