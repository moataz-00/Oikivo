import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { BookingEntity } from '../entities/booking.entity';
import { ExperienceBookingEntity } from '../entities/experience-booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([BookingEntity, ExperienceBookingEntity, EarningEntity]),
    NotificationsModule,
    MailModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
