import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminActivityLogService } from './admin-activity-log.service';
import { AdminLogInterceptor } from './admin-log.interceptor';
import { UserEntity } from '../entities/user.entity';
import { PropertyEntity } from '../entities/property.entity';
import { BookingEntity } from '../entities/booking.entity';
import { ReviewEntity } from '../entities/review.entity';
import { PayoutEntity } from '../entities/payout.entity';
import { EarningEntity } from '../entities/earning.entity';
import { DisputeEntity } from '../entities/dispute.entity';
import { ExperienceBookingEntity } from '../entities/experience-booking.entity';
import { AdminActivityLogEntity } from '../entities/admin-activity-log.entity';
import { PlatformSettingEntity } from '../entities/platform-setting.entity';
import { NotificationEntity } from '../entities/notification.entity';
import { ConversationEntity } from '../entities/conversation.entity';
import { MessageEntity } from '../entities/message.entity';
import { DisputesModule } from '../disputes/disputes.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AvailabilityModule } from '../availability/availability.module';
import { MailModule } from '../mail/mail.module';
import { CategoryEntity } from '../entities/category.entity';
import { AmenityEntity } from '../entities/amenity.entity';
import { ConsultantEntity } from '../entities/consultant.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { ExpenseEntity } from '../entities/expense.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      PropertyEntity,
      BookingEntity,
      ReviewEntity,
      PayoutEntity,
      EarningEntity,
      DisputeEntity,
      ExperienceBookingEntity,
      AdminActivityLogEntity,
      PlatformSettingEntity,
      NotificationEntity,
      ConversationEntity,
      MessageEntity,
      CategoryEntity,
      AmenityEntity,
      ConsultantEntity,
      ConsultationBookingEntity,
      ExpenseEntity,
    ]),
    DisputesModule,
    BookingsModule,
    NotificationsModule,
    AvailabilityModule,
    MailModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminActivityLogService, AdminLogInterceptor],
  exports: [AdminActivityLogService],
})
export class AdminModule {}
