import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity } from '../entities/user.entity';
import { ReviewEntity } from '../entities/review.entity';
import { BookingEntity } from '../entities/booking.entity';
import { PropertyEntity } from '../entities/property.entity';
import { PropertyPhotoEntity } from '../entities/property-photo.entity';
import { ExperienceEntity } from '../entities/experience.entity';
import { ExperiencePhotoEntity } from '../entities/experience-photo.entity';
import { MessageEntity } from '../entities/message.entity';
import { BlockedUserEntity } from '../entities/blocked-user.entity';
import { VerificationTokenEntity } from '../entities/verification-token.entity';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET environment variable is required');
        return { secret };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      ReviewEntity,
      BookingEntity,
      PropertyEntity,
      PropertyPhotoEntity,
      ExperienceEntity,
      ExperiencePhotoEntity,
      MessageEntity,
      BlockedUserEntity,
      VerificationTokenEntity,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
