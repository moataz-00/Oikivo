import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyEntity } from '../entities/property.entity';
import { PropertyPhotoEntity } from '../entities/property-photo.entity';
import { AmenityEntity } from '../entities/amenity.entity';
import { HouseRuleEntity } from '../entities/house-rule.entity';
import { ReviewEntity } from '../entities/review.entity';
import { UserEntity } from '../entities/user.entity';
import { BookingEntity } from '../entities/booking.entity';
import { PriceAlertEntity } from '../entities/price-alert.entity';
import { PriceAlertsModule } from '../price-alerts/price-alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PropertyEntity,
      PropertyPhotoEntity,
      AmenityEntity,
      HouseRuleEntity,
      ReviewEntity,
      UserEntity,
      BookingEntity,
      PriceAlertEntity,
    ]),
    PriceAlertsModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
