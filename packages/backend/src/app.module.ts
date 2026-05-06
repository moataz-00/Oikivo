import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { CategoriesModule } from './categories/categories.module';
import { AmenitiesModule } from './amenities/amenities.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagesModule } from './messages/messages.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AvailabilityModule } from './availability/availability.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import { UploadsModule } from './uploads/uploads.module';
import { PayoutsModule } from './payouts/payouts.module';
import { CohostsModule } from './cohosts/cohosts.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { DisputesModule } from './disputes/disputes.module';
import { PaymentsModule } from './payments/payments.module';
import { MailModule } from './mail/mail.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SmsModule } from './sms/sms.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { SavedSearchesModule } from './saved-searches/saved-searches.module';
import { PriceAlertsModule } from './price-alerts/price-alerts.module';
import { CommonModule } from './common/common.module';
import { CacheModule } from '@nestjs/cache-manager';

// Entities
import { UserEntity } from './entities/user.entity';
import { CategoryEntity } from './entities/category.entity';
import { AmenityEntity } from './entities/amenity.entity';
import { PropertyEntity } from './entities/property.entity';
import { PropertyPhotoEntity } from './entities/property-photo.entity';
import { PropertyAmenityEntity } from './entities/property-amenity.entity';
import { HouseRuleEntity } from './entities/house-rule.entity';
import { AvailabilityEntity } from './entities/availability.entity';
import { BookingEntity } from './entities/booking.entity';
import { ReviewEntity } from './entities/review.entity';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { WishlistEntity } from './entities/wishlist.entity';
import { WishlistItemEntity } from './entities/wishlist-item.entity';
import { NotificationEntity } from './entities/notification.entity';
import { CoHostEntity } from './entities/cohost.entity';
import { PasswordResetEntity } from './entities/password-reset.entity';
import { VerificationTokenEntity } from './entities/verification-token.entity';
import { EarningEntity } from './entities/earning.entity';
import { PayoutEntity } from './entities/payout.entity';
import { ExperienceEntity } from './entities/experience.entity';
import { ExperienceCategoryEntity } from './entities/experience-category.entity';
import { ExperiencePhotoEntity } from './entities/experience-photo.entity';
import { ExperienceItineraryEntity } from './entities/experience-itinerary.entity';
import { ExperienceBookingEntity } from './entities/experience-booking.entity';
import { ExperienceReviewEntity } from './entities/experience-review.entity';
import { ExperienceScheduleEntity } from './entities/experience-schedule.entity';
import { DisputeEntity } from './entities/dispute.entity';
import { ConsultantEntity } from './entities/consultant.entity';
import { ConsultantDocumentEntity } from './entities/consultant-document.entity';
import { ConsultationServiceEntity } from './entities/consultation-service.entity';
import { ConsultationBookingEntity } from './entities/consultation-booking.entity';
import { ConsultationReviewEntity } from './entities/consultation-review.entity';
import { ConsultantAvailabilityEntity } from './entities/consultant-availability.entity';
import { ICalSourceEntity } from './entities/ical-source.entity';
import { UserSessionEntity } from './entities/user-session.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { SavedSearchEntity } from './entities/saved-search.entity';
import { PlatformSettingEntity } from './entities/platform-setting.entity';
import { AdminActivityLogEntity } from './entities/admin-activity-log.entity';
import { ExpenseEntity } from './entities/expense.entity';
import { ConsultantEarningEntity } from './entities/consultant-earning.entity';
import { ConsultantVacationBlockEntity } from './entities/consultant-vacation-block.entity';
import { ConsultantPayoutRequestEntity } from './entities/consultant-payout-request.entity';
import { PriceAlertEntity } from './entities/price-alert.entity';
import { PropertyPriceHistoryEntity } from './entities/property-price-history.entity';
import { UserReportEntity } from './entities/user-report.entity';
import { BlockedUserEntity } from './entities/blocked-user.entity';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PayoutItemEntity } from './entities/payout-item.entity';
import { BookingStatusHistoryEntity } from './entities/booking-status-history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // P1: Use Redis when REDIS_URL is set, otherwise in-memory
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          const { redisStore } = await import('cache-manager-redis-yet');
          return { store: redisStore, url: redisUrl, ttl: 60_000 };
        }
        return { ttl: 60_000, max: 200 };
      },
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get('DB_USERNAME', 'root'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_DATABASE', 'sakan_db'),
        entities: [
          UserEntity,
          CategoryEntity,
          AmenityEntity,
          PropertyEntity,
          PropertyPhotoEntity,
          PropertyAmenityEntity,
          HouseRuleEntity,
          AvailabilityEntity,
          BookingEntity,
          ReviewEntity,
          ConversationEntity,
          MessageEntity,
          WishlistEntity,
          WishlistItemEntity,
          NotificationEntity,
          CoHostEntity,
          PasswordResetEntity,
          VerificationTokenEntity,
          EarningEntity,
          PayoutEntity,
          ExperienceEntity,
          ExperienceCategoryEntity,
          ExperiencePhotoEntity,
          ExperienceItineraryEntity,
          ExperienceBookingEntity,
          ExperienceReviewEntity,
          ExperienceScheduleEntity,
          DisputeEntity,
          ConsultantEntity,
          ConsultantDocumentEntity,
          ConsultationServiceEntity,
          ConsultationBookingEntity,
          ConsultationReviewEntity,
          ConsultantAvailabilityEntity,
          ICalSourceEntity,
          UserSessionEntity,
          AuditLogEntity,
          SavedSearchEntity,
          PlatformSettingEntity,
          AdminActivityLogEntity,
          ExpenseEntity,
          ConsultantEarningEntity,
          ConsultantVacationBlockEntity,
          ConsultantPayoutRequestEntity,
          PriceAlertEntity,
          PropertyPriceHistoryEntity,
          UserReportEntity,
          BlockedUserEntity,
          PaymentTransactionEntity,
          PayoutItemEntity,
          BookingStatusHistoryEntity,
        ],
        synchronize: false,  // schema managed via schema.sql
        charset: 'utf8mb4',
        timezone: '+00:00',
        logging: config.get('NODE_ENV') === 'development',
        extra: {
          connectionLimit: 25,
          // Keep connections alive so MySQL doesn't drop them after wait_timeout
          enableKeepAlive: true,
          keepAliveInitialDelay: 30000,
          // Automatically reconnect on ECONNRESET / lost connection
          connectTimeout: 30000,
          waitForConnections: true,
          queueLimit: 0,
        },
        retryAttempts: 10,
        retryDelay: 3000,
      }),
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),
    CommonModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    CategoriesModule,
    AmenitiesModule,
    BookingsModule,
    ReviewsModule,
    MessagesModule,
    WishlistsModule,
    NotificationsModule,
    AvailabilityModule,
    SearchModule,
    AdminModule,
    UploadsModule,
    PayoutsModule,
    CohostsModule,
    ExperiencesModule,
    DisputesModule,
    PaymentsModule,
    MailModule,
    SmsModule,
    SchedulerModule,
    ConsultationsModule,
    AuditLogModule,
    SavedSearchesModule,
    PriceAlertsModule,
  ],
  providers: [
    // Enforce @Throttle() decorators across all controllers globally
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
