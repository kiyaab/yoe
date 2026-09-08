import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'yalfal_super_secret_jwt_key_ethiopia_2026_production',
    });
  }

  async validate(payload: any) {
    // If payload contains sub for admin
    if (payload.type === 'admin') {
      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.sub },
      });
      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Admin account is inactive or not found');
      }
      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
        type: 'admin',
      };
    }

    // User payload
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('User account suspended or not found');
    }
    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      type: 'user',
    };
  }
}
