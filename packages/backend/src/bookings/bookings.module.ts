import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingEntity } from '../entities/booking.entity';
import { PropertyEntity } from '../entities/property.entity';
import { UserEntity } from '../entities/user.entity';
import { AvailabilityEntity } from '../entities/availability.entity';
import { EarningEntity } from '../entities/earning.entity';
import { CoHostEntity } from '../entities/cohost.entity';
import { AvailabilityModule } from '../availability/availability.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      BookingEntity,
      PropertyEntity,
      UserEntity,
      AvailabilityEntity,
      EarningEntity,
      CoHostEntity,
    ]),
    AvailabilityModule,
    NotificationsModule,
    PaymentsModule,
    AuditLogModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
