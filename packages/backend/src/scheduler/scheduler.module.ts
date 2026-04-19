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
import { SavedSearchEntity } from '../entities/saved-search.entity';
import { UserEntity } from '../entities/user.entity';
import { PriceAlertEntity } from '../entities/price-alert.entity';
import { PasswordResetEntity } from '../entities/password-reset.entity';
import { VerificationTokenEntity } from '../entities/verification-token.entity';
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
      SavedSearchEntity,
      UserEntity,
      PriceAlertEntity,
      PasswordResetEntity,
      VerificationTokenEntity,
    ]),
    NotificationsModule,
    MailModule,
    PayoutsModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {}
