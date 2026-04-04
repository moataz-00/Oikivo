import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { BookingEntity } from '../entities/booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { PropertyEntity } from '../entities/property.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { DisputeEntity } from '../entities/dispute.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingEntity,
      EarningEntity,
      PropertyEntity,
      ConsultationBookingEntity,
      DisputeEntity,
    ]),
    NotificationsModule,
    MailModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
