import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PriceAlertsController } from './price-alerts.controller';
import { PriceAlertsService } from './price-alerts.service';
import { PriceAlertEntity } from '../entities/price-alert.entity';
import { PropertyEntity } from '../entities/property.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PriceAlertEntity, PropertyEntity])],
  controllers: [PriceAlertsController],
  providers: [PriceAlertsService],
  exports: [PriceAlertsService],
})
export class PriceAlertsModule {}
