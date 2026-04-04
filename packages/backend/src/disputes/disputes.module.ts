import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisputesController } from './disputes.controller';
import { DisputesService } from './disputes.service';
import { DisputeEntity } from '../entities/dispute.entity';
import { BookingEntity } from '../entities/booking.entity';
import { EarningEntity } from '../entities/earning.entity';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DisputeEntity, BookingEntity, EarningEntity]),
    BookingsModule,
  ],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
