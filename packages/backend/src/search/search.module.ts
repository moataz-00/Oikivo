import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PropertyEntity } from '../entities/property.entity';
import { BookingEntity } from '../entities/booking.entity';
import { AvailabilityEntity } from '../entities/availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyEntity, BookingEntity, AvailabilityEntity]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
