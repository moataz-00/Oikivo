import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserEntity } from '../entities/user.entity';
import { PasswordResetEntity } from '../entities/password-reset.entity';
import { VerificationTokenEntity } from '../entities/verification-token.entity';
import { AdminActivityLogEntity } from '../entities/admin-activity-log.entity';
import { UserSessionEntity } from '../entities/user-session.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      UserEntity,
      PasswordResetEntity,
      VerificationTokenEntity,
      AdminActivityLogEntity,
      UserSessionEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'sakan-secret'),
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
