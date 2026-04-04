import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmenitiesController } from './amenities.controller';
import { AmenitiesService } from './amenities.service';
import { AmenityEntity } from '../entities/amenity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AmenityEntity])],
  controllers: [AmenitiesController],
  providers: [AmenitiesService],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}
