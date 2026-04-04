import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ExperiencesController, ExperienceBookingsController, ExperienceReviewsController } from './experiences.controller';
import { ExperiencesService } from './experiences.service';
import { ExperienceBookingsService } from './experience-bookings.service';
import { ExperienceReviewsService } from './experience-reviews.service';
import { ExperienceEntity } from '../entities/experience.entity';
import { ExperienceCategoryEntity } from '../entities/experience-category.entity';
import { ExperiencePhotoEntity } from '../entities/experience-photo.entity';
import { ExperienceItineraryEntity } from '../entities/experience-itinerary.entity';
import { ExperienceBookingEntity } from '../entities/experience-booking.entity';
import { ExperienceReviewEntity } from '../entities/experience-review.entity';
import { ExperienceScheduleEntity } from '../entities/experience-schedule.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExperienceEntity,
      ExperienceCategoryEntity,
      ExperiencePhotoEntity,
      ExperienceItineraryEntity,
      ExperienceBookingEntity,
      ExperienceReviewEntity,
      ExperienceScheduleEntity,
    ]),
    ConfigModule,
    NotificationsModule,
    MailModule,
  ],
  controllers: [
    ExperiencesController,
    ExperienceBookingsController,
    ExperienceReviewsController,
  ],
  providers: [
    ExperiencesService,
    ExperienceBookingsService,
    ExperienceReviewsService,
  ],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
