import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { BookingEntity } from '../entities/booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { PropertyEntity } from '../entities/property.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { DisputeEntity } from '../entities/dispute.entity';
import { WishlistItemEntity } from '../entities/wishlist-item.entity';
import { WishlistEntity } from '../entities/wishlist.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { PayoutsModule } from '../payouts/payouts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookingEntity,
      EarningEntity,
      PropertyEntity,
      ConsultationBookingEntity,
      DisputeEntity,
      WishlistItemEntity,
      WishlistEntity,
    ]),
    NotificationsModule,
    MailModule,
    PayoutsModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
