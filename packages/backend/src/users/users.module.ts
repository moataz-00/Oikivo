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

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'sakan-secret'),
      }),
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
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
