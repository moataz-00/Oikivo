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
import { DisputesModule } from '../disputes/disputes.module';
import { BookingsModule } from '../bookings/bookings.module';
import { NotificationsModule } from '../notifications/notifications.module';

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
      PlatformSettingEntity,      NotificationEntity,    ]),
    DisputesModule,
    BookingsModule,
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminActivityLogService, AdminLogInterceptor],
  exports: [AdminActivityLogService],
})
export class AdminModule {}
