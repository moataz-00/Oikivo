import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { EarningEntity } from '../entities/earning.entity';
import { PayoutEntity } from '../entities/payout.entity';
import { BookingEntity } from '../entities/booking.entity';
import { UserEntity } from '../entities/user.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([EarningEntity, PayoutEntity, BookingEntity, UserEntity]), AuditLogModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
