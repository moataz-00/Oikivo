import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { ICalSyncService } from './ical-sync.service';
import { AvailabilityEntity } from '../entities/availability.entity';
import { ICalSourceEntity } from '../entities/ical-source.entity';
import { BookingEntity } from '../entities/booking.entity';
import { PropertyEntity } from '../entities/property.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AvailabilityEntity,
      ICalSourceEntity,
      BookingEntity,
      PropertyEntity,
    ]),
    NotificationsModule,
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, ICalSyncService],
  exports: [AvailabilityService, ICalSyncService],
})
export class AvailabilityModule {}
