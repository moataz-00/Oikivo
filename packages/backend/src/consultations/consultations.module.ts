import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import {
  ConsultationsPublicController,
  ConsultationsAuthController,
  ConsultationsAdminController,
} from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { ConsultationSchedulerService } from './consultation-scheduler.service';
import { ConsultantEntity } from '../entities/consultant.entity';
import { ConsultantDocumentEntity } from '../entities/consultant-document.entity';
import { ConsultationBookingEntity } from '../entities/consultation-booking.entity';
import { ConsultationReviewEntity } from '../entities/consultation-review.entity';
import { ConsultantAvailabilityEntity } from '../entities/consultant-availability.entity';
import { ConsultantVacationBlockEntity } from '../entities/consultant-vacation-block.entity';
import { ConsultantEarningEntity } from '../entities/consultant-earning.entity';
import { ConsultantPayoutRequestEntity } from '../entities/consultant-payout-request.entity';
import { UserEntity } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ConsultantEntity,
      ConsultantDocumentEntity,
      ConsultationBookingEntity,
      ConsultationReviewEntity,
      ConsultantAvailabilityEntity,
      ConsultantVacationBlockEntity,
      ConsultantEarningEntity,
      ConsultantPayoutRequestEntity,
      UserEntity,
    ]),
    NotificationsModule,
    MailModule,
  ],
  controllers: [
    ConsultationsPublicController,
    ConsultationsAuthController,
    ConsultationsAdminController,
  ],
  providers: [ConsultationsService, ConsultationSchedulerService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
