import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { UserEntity } from '../../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
  ) {
    super({
      // Try Bearer header first; fall back to httpOnly cookie (admin panel)
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => (req?.cookies as Record<string, string>)?.access_token ?? null,
      ]),
      secretOrKey: config.get('JWT_SECRET', 'sakan-secret'),
    });
  }

  async validate(payload: { sub: number }) {
    const user = await this.users.findOne({
      where: { id: payload.sub, isActive: true },
      select: [
        'id', 'profileUuid', 'email', 'firstName', 'lastName', 'avatarUrl',
        'phone', 'bio', 'dateOfBirth', 'isHost', 'isSuperhost',
        'isEmailVerified', 'isPhoneVerified', 'isIdVerified',
        'idVerificationStatus', 'idDocumentUrl', 'isAdmin', 'isActive',
        'preferredLanguage', 'createdAt', 'updatedAt', 'isConsultant',
      ],
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
