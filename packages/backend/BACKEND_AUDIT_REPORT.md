# Oikivo Backend Audit Report

> **Scope**: `packages/backend/src/` — Research-only, no code changes  
> **Framework**: NestJS + TypeORM (MySQL) on port 3001  
> **Global prefix**: `/api` — Swagger at `/api/docs` (disabled in production)

---

## 1. Complete Modules List

### 1.1 Feature Modules Registered in `app.module.ts` (26)

| # | Module | Folder | Global? | Controllers | Providers | Exports |
|---|--------|--------|---------|-------------|-----------|---------|
| 1 | CommonModule | `common/` | **Yes** | — | CurrencyService | CurrencyService |
| 2 | AuthModule | `auth/` | No | AuthController | AuthService, JwtStrategy, GoogleStrategy | AuthService, JwtModule, PassportModule |
| 3 | UsersModule | `users/` | No | UsersController | UsersService | UsersService |
| 4 | PropertiesModule | `properties/` | No | PropertiesController, PriceAlertController | PropertiesService, PriceAlertService | PropertiesService |
| 5 | CategoriesModule | `categories/` | No | CategoriesController | CategoriesService | CategoriesService |
| 6 | AmenitiesModule | `amenities/` | No | AmenitiesController | AmenitiesService | AmenitiesService |
| 7 | BookingsModule | `bookings/` | No | BookingsController | BookingsService, InvoiceService | BookingsService |
| 8 | ReviewsModule | `reviews/` | No | ReviewsController | ReviewsService | ReviewsService |
| 9 | MessagesModule | `messages/` | No | MessagesController | MessagesService, MessagesGateway | MessagesService, MessagesGateway |
| 10 | WishlistsModule | `wishlists/` | No | WishlistsController | WishlistsService | WishlistsService |
| 11 | NotificationsModule | `notifications/` | No | NotificationsController | NotificationsService, PushService | NotificationsService, PushService |
| 12 | AvailabilityModule | `availability/` | No | AvailabilityController | AvailabilityService, ICalSyncService | AvailabilityService, ICalSyncService |
| 13 | SearchModule | `search/` | No | SearchController | SearchService | SearchService |
| 14 | AdminModule | `admin/` | No | AdminController | AdminService, AdminActivityLogService, AdminLogInterceptor, AdminIpAllowlistGuard | AdminActivityLogService |
| 15 | UploadsModule | `uploads/` | No | UploadsController | *(none — controller uses @InjectRepository directly)* | — |
| 16 | PayoutsModule | `payouts/` | No | PayoutsController | PayoutsService | PayoutsService |
| 17 | CohostsModule | `cohosts/` | No | CohostsController, CohostInvitesController | CohostsService, CoHostGuard | CohostsService, CoHostGuard |
| 18 | ExperiencesModule | `experiences/` | No | ExperiencesController, ExperienceBookingsController, ExperienceReviewsController | ExperiencesService, ExperienceBookingsService, ExperienceReviewsService | ExperiencesService |
| 19 | DisputesModule | `disputes/` | No | DisputesController | DisputesService | DisputesService |
| 20 | PaymentsModule | `payments/` | No | PaymentsController | PaymentsService | PaymentsService |
| 21 | MailModule | `mail/` | **Yes** | — | MailService | MailService |
| 22 | SmsModule | `sms/` | **Yes** | — | SmsService | SmsService |
| 23 | SchedulerModule | `scheduler/` | No | — | SchedulerService | — |
| 24 | ConsultationsModule | `consultations/` | No | ConsultationsPublicController, ConsultationsAuthController, ConsultationsAdminController | ConsultationsService, ConsultationSchedulerService | ConsultationsService |
| 25 | AuditLogModule | `audit-log/` | No | — | AuditLogService | AuditLogService |
| 26 | SavedSearchesModule | `saved-searches/` | No | SavedSearchesController | SavedSearchesService | — |

### 1.2 Framework/Infrastructure Modules (in `app.module.ts` imports)

| Module | Configuration |
|--------|--------------|
| ConfigModule.forRoot | `isGlobal: true` |
| CacheModule.registerAsync | Global; Redis when `REDIS_URL` set, otherwise in-memory (TTL 60s, max 200) |
| ThrottlerModule.forRoot | 60s window, 100 requests |
| TypeOrmModule.forRootAsync | MySQL, 51 entities, `synchronize: false`, utf8mb4, connectionLimit 25 |
| ScheduleModule.forRoot | Cron job support |

### 1.3 Global Providers (in `app.module.ts`)

| Token | Class |
|-------|-------|
| APP_GUARD | ThrottlerGuard |

### 1.4 Folder vs Module Registration

- **27 folders** under `src/`: admin, amenities, audit-log, auth, availability, bookings, categories, cohosts, common, consultations, disputes, **entities**, experiences, mail, messages, notifications, payments, payouts, properties, reviews, saved-searches, scheduler, search, sms, uploads, users, wishlists
- **`entities/`** is a shared directory (no module) — stores all 51 entity files. **Expected, not a mismatch.**
- All other 26 folders have corresponding modules registered in `app.module.ts`. **✅ No mismatches.**

---

## 2. Complete Endpoints List

All endpoints below are prefixed with `/api` (global prefix set in `main.ts`).

### 2.1 Auth (`/api/auth`) — AuthController

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/admin-logout` | Public |
| POST | `/auth/refresh` | Public |
| GET | `/auth/me` | JWT |
| POST | `/auth/logout` | JWT |
| POST | `/auth/forgot-password` | Public |
| POST | `/auth/reset-password` | Public |
| POST | `/auth/send-verification-email` | JWT |
| GET | `/auth/verify-email` | Public |
| POST | `/auth/send-phone-verification` | JWT |
| POST | `/auth/verify-phone` | JWT |
| POST | `/auth/change-password` | JWT |
| POST | `/auth/set-password` | JWT |
| POST | `/auth/request-email-change` | JWT |
| GET | `/auth/confirm-email-change` | Public |
| GET | `/auth/google` | Google OAuth |
| GET | `/auth/google/callback` | Google OAuth |
| GET | `/auth/validate-reset-token` | Public |
| DELETE | `/auth/google/unlink` | JWT |
| POST | `/auth/totp/setup` | JWT |
| POST | `/auth/totp/verify` | JWT |
| POST | `/auth/totp/disable` | JWT |
| GET | `/auth/totp/status` | JWT |
| GET | `/auth/sessions` | JWT |
| DELETE | `/auth/sessions/:id` | JWT |
| DELETE | `/auth/sessions` | JWT |

### 2.2 Users (`/api/users`) — UsersController

| Method | Path | Auth |
|--------|------|------|
| GET | `/users/me` | JWT |
| GET | `/users/available-cohosts` | JWT |
| PATCH | `/users/me` | JWT |
| POST | `/users/me/become-host` | JWT |
| POST | `/users/me/request-host-activation` | JWT |
| GET | `/users/host-activation/confirm` | Public |
| POST | `/users/me/avatar` | JWT |
| POST | `/users/me/verify-id` | JWT |
| GET | `/users/:id/id-document/:filename` | JWT |
| GET | `/users/profile/:uuid` | Public |
| GET | `/users/:id` | Public |
| GET | `/users/:id/listings` | Public |
| GET | `/users/:id/reviews` | Public |
| GET | `/users/:id/stats` | Public |
| GET | `/users/me/notification-preferences` | JWT |
| PATCH | `/users/me/notification-preferences` | JWT |
| DELETE | `/users/me` | JWT |
| GET | `/users/me/export` | JWT |
| POST | `/users/:id/block` | JWT |
| DELETE | `/users/:id/block` | JWT |
| GET | `/users/me/blocked` | JWT |

### 2.3 Properties (`/api/properties`) — PropertiesController

| Method | Path | Auth |
|--------|------|------|
| GET | `/properties/host/listings` | JWT |
| GET | `/properties/host/archived` | JWT |
| GET | `/properties/host/compare` | JWT |
| GET | `/properties/:id` | Public |
| POST | `/properties` | JWT |
| PATCH | `/properties/:id` | JWT |
| DELETE | `/properties/:id` | JWT |
| POST | `/properties/:id/publish` | JWT |
| GET | `/properties/:id/verify` | JWT |
| POST | `/properties/:id/archive` | JWT |
| POST | `/properties/:id/unpublish` | JWT |
| POST | `/properties/:id/restore` | JWT |
| DELETE | `/properties/:id/permanent` | JWT |
| PATCH | `/properties/:id/amenities` | JWT |
| PATCH | `/properties/:id/house-rules` | JWT |
| GET | `/properties/:id/price-preview` | JWT |
| GET | `/properties/:id/pricing-suggestion` | JWT |
| POST | `/properties/bulk-action` | JWT |
| POST | `/properties/bulk-pricing` | JWT |
| POST | `/properties/bulk-settings` | JWT |
| POST | `/properties/:id/transfer` | JWT |

### 2.4 Price Alerts (`/api/price-alerts`) — PriceAlertController

| Method | Path | Auth |
|--------|------|------|
| GET | `/price-alerts` | JWT |
| POST | `/price-alerts` | JWT |
| DELETE | `/price-alerts/:id` | JWT |

### 2.5 Bookings (`/api/bookings`) — BookingsController

| Method | Path | Auth |
|--------|------|------|
| POST | `/bookings` | JWT |
| GET | `/bookings/my-trips` | JWT |
| GET | `/bookings/my-payments` | JWT |
| GET | `/bookings/host/reservations` | JWT |
| GET | `/bookings/host/calendar` | JWT |
| GET | `/bookings/host/pending-payments` | JWT |
| GET | `/bookings/host/analytics` | JWT |
| GET | `/bookings/host/forecast` | JWT |
| GET | `/bookings/host/market-insights` | JWT |
| GET | `/bookings/host/ranking-tips/:propertyId` | JWT |
| GET | `/bookings/ref/:uuid` | JWT |
| GET | `/bookings/:id/invoice` | JWT |
| GET | `/bookings/:id` | JWT |
| PATCH | `/bookings/:id/confirm` | JWT |
| PATCH | `/bookings/:id/decline` | JWT |
| PATCH | `/bookings/:id/cancel` | JWT |
| GET | `/bookings/:id/cancellation-preview` | JWT |
| PATCH | `/bookings/:id/submit-payment` | JWT |
| POST | `/bookings/:id/upload-payment-proof` | JWT |
| GET | `/bookings/:id/payment-proof/:filename` | JWT |
| PATCH | `/bookings/:id/confirm-payment` | JWT |
| PATCH | `/bookings/:id/decline-payment` | JWT |
| PATCH | `/bookings/:id/host-notes` | JWT |
| POST | `/bookings/:id/deposit/claim` | JWT |
| PATCH | `/bookings/:id/deposit/release` | JWT |

### 2.6 Reviews (`/api/reviews`) — ReviewsController

| Method | Path | Auth |
|--------|------|------|
| POST | `/reviews` | JWT |
| PATCH | `/reviews/:id` | JWT |
| PATCH | `/reviews/:id/reply` | JWT |
| GET | `/reviews/property/:propertyId` | Public |
| GET | `/reviews/property/:propertyId/stats` | Public |
| POST | `/reviews/:id/photos` | JWT |
| DELETE | `/reviews/:id` | JWT |

### 2.7 Messages (`/api/messages`) — MessagesController

| Method | Path | Auth |
|--------|------|------|
| GET | `/messages/conversations` | JWT |
| GET | `/messages/conversations/:id` | JWT |
| POST | `/messages/conversations/:id/messages` | JWT |
| POST | `/messages/conversations/:id/upload` | JWT |
| GET | `/messages/conversations/:id/image/:filename` | JWT |
| POST | `/messages/conversations` | JWT |
| POST | `/messages` | JWT |
| PATCH | `/messages/conversations/:id/read` | JWT |
| GET | `/messages/search` | JWT |
| GET | `/messages/unread-count` | JWT |

### 2.8 Wishlists (`/api/wishlists`) — WishlistsController

| Method | Path | Auth |
|--------|------|------|
| GET | `/wishlists/share/:token` | Public |
| GET | `/wishlists` | JWT |
| POST | `/wishlists` | JWT |
| GET | `/wishlists/check/:propertyId` | JWT |
| GET | `/wishlists/:id` | JWT |
| PATCH | `/wishlists/:id` | JWT |
| DELETE | `/wishlists/:id` | JWT |
| POST | `/wishlists/:id/items` | JWT |
| DELETE | `/wishlists/:id/items/:propertyId` | JWT |
| POST | `/wishlists/:id/rotate-token` | JWT |

### 2.9 Notifications (`/api/notifications`) — NotificationsController

| Method | Path | Auth |
|--------|------|------|
| GET | `/notifications` | JWT |
| PATCH | `/notifications/mark-all-read` | JWT |
| GET | `/notifications/unread-count` | JWT |
| PATCH | `/notifications/:id/read` | JWT |
| SSE | `/notifications/stream` | JWT |
| POST | `/notifications/push-token` | JWT |
| DELETE | `/notifications/push-token` | JWT |

### 2.10 Search (`/api/search`) — SearchController

| Method | Path | Auth |
|--------|------|------|
| GET | `/search` | Public (ThrottlerGuard) |
| GET | `/search/nearby` | Public |
| GET | `/search/popular-cities` | Public (CacheInterceptor) |

### 2.11 Availability (`/api/availability`) — AvailabilityController

| Method | Path | Auth |
|--------|------|------|
| GET | `/availability/:propertyId` | Public |
| GET | `/availability/:propertyId/ranges` | JWT |
| POST | `/availability/:propertyId/block` | JWT |
| POST | `/availability/:propertyId/seasonal-pricing` | JWT |
| POST | `/availability/bulk/block` | JWT |
| POST | `/availability/bulk/seasonal-pricing` | JWT |
| GET | `/availability/:propertyId/channels` | JWT |
| POST | `/availability/:propertyId/channels` | JWT |
| DELETE | `/availability/:propertyId/channels/:sourceId` | JWT |
| POST | `/availability/:propertyId/channels/:sourceId/sync` | JWT |
| GET | `/availability/:propertyId/calendar.ics` | Public |

### 2.12 Amenities (`/api/amenities`) — AmenitiesController

| Method | Path | Auth |
|--------|------|------|
| GET | `/amenities` | Public |

### 2.13 Categories (`/api/categories`) — CategoriesController

| Method | Path | Auth |
|--------|------|------|
| GET | `/categories` | Public |
| GET | `/categories/:id` | Public |

### 2.14 Cohosts — CohostsController & CohostInvitesController

**CohostsController (`/api/properties/:propertyId/cohosts`)**:

| Method | Path | Auth |
|--------|------|------|
| GET | `/properties/:propertyId/cohosts` | JWT + CoHostGuard |
| POST | `/properties/:propertyId/cohosts` | JWT + CoHostGuard |
| PATCH | `/properties/:propertyId/cohosts/:cohostId/respond` | JWT + CoHostGuard |
| PATCH | `/properties/:propertyId/cohosts/:cohostId/reinvite` | JWT + CoHostGuard |
| DELETE | `/properties/:propertyId/cohosts/:cohostId` | JWT + CoHostGuard |

**CohostInvitesController (`/api/cohosts`)**:

| Method | Path | Auth |
|--------|------|------|
| GET | `/cohosts/my-invites` | JWT |
| GET | `/cohosts/my-team` | JWT |
| GET | `/cohosts/my-properties` | JWT |

### 2.15 Saved Searches (`/api/saved-searches`) — SavedSearchesController

| Method | Path | Auth |
|--------|------|------|
| GET | `/saved-searches` | JWT |
| POST | `/saved-searches` | JWT |
| DELETE | `/saved-searches/:id` | JWT |
| PATCH | `/saved-searches/:id/toggle-alert` | JWT |

### 2.16 Disputes (`/api/disputes`) — DisputesController

| Method | Path | Auth |
|--------|------|------|
| POST | `/disputes` | JWT |
| GET | `/disputes` | JWT |
| GET | `/disputes/:id` | JWT |
| PATCH | `/disputes/:id/update` | JWT |
| POST | `/disputes/:id/evidence` | JWT (FileInterceptor) |
| DELETE | `/disputes/:id/evidence` | JWT |
| POST | `/disputes/:id/appeal` | JWT |
| GET | `/disputes/appeals/pending` | JWT |
| PATCH | `/disputes/:id/appeal/resolve` | JWT |

### 2.17 Payments (`/api/payments`) — PaymentsController

| Method | Path | Auth |
|--------|------|------|
| POST | `/payments/create-intent` | JWT |
| POST | `/payments/refund` | JWT |
| POST | `/payments/opay/checkout` | JWT |
| POST | `/payments/opay/refund` | JWT |
| POST | `/payments/opay/callback` | Public |
| POST | `/payments/webhook` | Public (Stripe raw body) |

### 2.18 Payouts (`/api/payouts`) — PayoutsController

| Method | Path | Auth |
|--------|------|------|
| GET | `/payouts/earnings` | JWT |
| POST | `/payouts/request` | JWT |
| GET | `/payouts/history` | JWT |
| GET | `/payouts/settings` | JWT |
| PATCH | `/payouts/settings` | JWT |
| GET | `/payouts/tax-documents/annual-summary` | JWT |
| GET | `/payouts/tax-documents/payout-invoices` | JWT |

### 2.19 Uploads (`/api/uploads`) — UploadsController

| Method | Path | Auth |
|--------|------|------|
| POST | `/uploads/photos/:id` | JWT (FilesInterceptor) |
| DELETE | `/uploads/photos/:photoId` | JWT |
| PATCH | `/uploads/photos/:photoId/cover` | JWT |
| PATCH | `/uploads/photos/reorder` | JWT |
| POST | `/uploads/experience-photos/:id` | JWT (FilesInterceptor) |
| DELETE | `/uploads/experience-photos/:photoId` | JWT |
| POST | `/uploads/avatar` | JWT (FileInterceptor) |

### 2.20 Experiences — 3 Controllers

**ExperiencesController (`/api/experiences`)**:

| Method | Path | Auth |
|--------|------|------|
| GET | `/experiences/categories` | Public |
| GET | `/experiences/search` | Public |
| GET | `/experiences/host/listings` | JWT |
| GET | `/experiences/:id/price-preview` | JWT |
| GET | `/experiences/:id` | Public |
| POST | `/experiences` | JWT |
| PATCH | `/experiences/:id` | JWT |
| DELETE | `/experiences/:id` | JWT |
| POST | `/experiences/:id/publish` | JWT |
| POST | `/experiences/:id/archive` | JWT |
| POST | `/experiences/:id/restore` | JWT |

**ExperienceBookingsController (`/api/experience-bookings`)**:

| Method | Path | Auth |
|--------|------|------|
| POST | `/experience-bookings` | JWT |
| GET | `/experience-bookings/my-trips` | JWT |
| GET | `/experience-bookings/host/reservations` | JWT |
| GET | `/experience-bookings/host/analytics` | JWT |
| GET | `/experience-bookings/:id` | JWT |
| PATCH | `/experience-bookings/:id/confirm` | JWT |
| PATCH | `/experience-bookings/:id/decline` | JWT |
| PATCH | `/experience-bookings/:id/cancel` | JWT |
| PATCH | `/experience-bookings/:id/complete` | JWT |
| PATCH | `/experience-bookings/:id/submit-payment` | JWT |
| PATCH | `/experience-bookings/:id/confirm-payment` | JWT |

**ExperienceReviewsController (`/api/experience-reviews`)**:

| Method | Path | Auth |
|--------|------|------|
| POST | `/experience-reviews` | JWT |
| PATCH | `/experience-reviews/:id/reply` | JWT |
| GET | `/experience-reviews/experience/:experienceId` | Public |
| GET | `/experience-reviews/experience/:experienceId/stats` | Public |

### 2.21 Consultations — 3 Controllers

**ConsultationsPublicController (`/api/consultations`)**:

| Method | Path | Auth |
|--------|------|------|
| GET | `/consultations/consultants` | Public |
| GET | `/consultations/consultants/:id/slots` | Public |
| GET | `/consultations/consultants/:id` | Public |

**ConsultationsAuthController (`/api/consultations`)**:

| Method | Path | Auth |
|--------|------|------|
| POST | `/consultations/apply` | JWT |
| GET | `/consultations/my-profile` | JWT |
| PATCH | `/consultations/my-profile` | JWT |
| POST | `/consultations/documents` | JWT (FileInterceptor) |
| POST | `/consultations/availability` | JWT |
| POST | `/consultations/vacation` | JWT |
| GET | `/consultations/vacation` | JWT |
| DELETE | `/consultations/vacation/:id` | JWT |
| POST | `/consultations/book` | JWT |
| PATCH | `/consultations/bookings/:id/respond` | JWT |
| PATCH | `/consultations/bookings/:id/complete` | JWT |
| PATCH | `/consultations/bookings/:id/start` | JWT |
| PATCH | `/consultations/bookings/:id/cancel` | JWT |
| PATCH | `/consultations/bookings/:id/confirm-completion` | JWT |
| POST | `/consultations/bookings/:id/report-issue` | JWT |
| PATCH | `/consultations/bookings/:id/mark-instapay-paid` | JWT |
| POST | `/consultations/bookings/:id/submit-instapay-proof` | JWT |
| POST | `/consultations/bookings/:id/upload-payment-proof` | JWT (FileInterceptor) |
| GET | `/consultations/my-bookings` | JWT |
| GET | `/consultations/consultant-bookings` | JWT |
| GET | `/consultations/my-stats` | JWT |
| POST | `/consultations/bookings/:id/review` | JWT |
| PATCH | `/consultations/reviews/:id/reply` | JWT |
| POST | `/consultations/reviews/:id/flag` | JWT |
| GET | `/consultations/earnings` | JWT |
| GET | `/consultations/payouts` | JWT |
| POST | `/consultations/payouts/request` | JWT |
| PATCH | `/consultations/payout-settings` | JWT |
| PATCH | `/consultations/bookings/bulk-respond` | JWT |
| PATCH | `/consultations/bookings/:id/reschedule` | JWT |
| GET | `/consultations/instapay-info` | JWT |
| GET | `/consultations/earnings/export` | JWT |

**ConsultationsAdminController (`/api/admin/consultations`)**:

| Method | Path | Auth |
|--------|------|------|
| GET | `/admin/consultations/stats` | JWT + AdminGuard |
| GET | `/admin/consultations/revenue` | JWT + AdminGuard |
| GET | `/admin/consultations/consultants` | JWT + AdminGuard |
| GET | `/admin/consultations/consultants/:id` | JWT + AdminGuard |
| PATCH | `/admin/consultations/consultants/:id` | JWT + AdminGuard |
| GET | `/admin/consultations/consultants/:id/bookings` | JWT + AdminGuard |
| PATCH | `/admin/consultations/consultants/:id/review` | JWT + AdminGuard |
| GET | `/admin/consultations/reviews` | JWT + AdminGuard |
| PATCH | `/admin/consultations/reviews/:id/hide` | JWT + AdminGuard |
| GET | `/admin/consultations/payouts` | JWT + AdminGuard |
| PATCH | `/admin/consultations/payouts/:id` | JWT + AdminGuard |
| PATCH | `/admin/consultations/bookings/:id/no-show` | JWT + AdminGuard |
| PATCH | `/admin/consultations/bookings/:id/dispute` | JWT + AdminGuard |
| PATCH | `/admin/consultations/bookings/:id/resolve-dispute` | JWT + AdminGuard |
| GET | `/admin/consultations/pending-refunds` | JWT + AdminGuard |
| PATCH | `/admin/consultations/bookings/:id/process-refund` | JWT + AdminGuard |
| GET | `/admin/consultations/pending-payments` | JWT + AdminGuard |

### 2.22 Admin (`/api/admin`) — AdminController

All endpoints require **JWT + AdminGuard + AdminIpAllowlistGuard** and are logged by **AdminLogInterceptor**.

| Method | Path |
|--------|------|
| GET | `/admin/dashboard` |
| GET | `/admin/users` |
| PATCH | `/admin/users/:id/toggle-active` |
| PATCH | `/admin/users/:id/toggle-admin` |
| PATCH | `/admin/users/:id/review-id` |
| POST | `/admin/users/bulk` |
| POST | `/admin/properties/bulk` |
| GET | `/admin/properties` |
| PATCH | `/admin/properties/:id/status` |
| GET | `/admin/bookings` |
| POST | `/admin/bookings/:id/confirm-payment` |
| POST | `/admin/bookings/:id/decline-payment` |
| GET | `/admin/payments/instapay-refunds-pending` |
| POST | `/admin/bookings/:id/mark-instapay-refunded` |
| GET | `/admin/reviews` |
| DELETE | `/admin/reviews/:id` |
| GET | `/admin/revenue-chart` |
| GET | `/admin/payouts` |
| PATCH | `/admin/payouts/:id/process` |
| GET | `/admin/disputes` |
| PATCH | `/admin/disputes/:id/resolve` |
| PATCH | `/admin/disputes/:id/status` |
| PATCH | `/admin/disputes/:id/assign` |
| PATCH | `/admin/disputes/:id/priority` |
| PATCH | `/admin/disputes/:id/sla` |
| GET | `/admin/experience-bookings` |
| PATCH | `/admin/experience-bookings/:id/confirm-payment` |
| GET | `/admin/activity-log` |
| GET | `/admin/settings` |
| PATCH | `/admin/settings/:key` |
| GET | `/admin/analytics/enhanced` |
| GET | `/admin/analytics` |
| GET | `/admin/notifications` |
| POST | `/admin/notifications/blast` |
| GET | `/admin/badge-counts` |
| GET | `/admin/system-health` |
| POST | `/admin/send-email-blast` |
| POST | `/admin/send-test-email` |
| GET | `/admin/ical-sources` |
| POST | `/admin/ical-sources/:id/sync` |
| GET | `/admin/users/:id` |
| PATCH | `/admin/users/:id` |
| DELETE | `/admin/users/:id` |
| PATCH | `/admin/users/:id/ban` |
| GET | `/admin/properties/:id` |
| PATCH | `/admin/properties/:id` |
| DELETE | `/admin/properties/:id` |
| GET | `/admin/bookings/:id` |
| PATCH | `/admin/bookings/:id` |
| POST | `/admin/bookings/:id/admin-cancel` |
| POST | `/admin/bookings/:id/admin-refund` |
| GET | `/admin/categories` |
| POST | `/admin/categories` |
| PATCH | `/admin/categories/:id` |
| DELETE | `/admin/categories/:id` |
| GET | `/admin/amenities` |
| POST | `/admin/amenities` |
| PATCH | `/admin/amenities/:id` |
| DELETE | `/admin/amenities/:id` |
| GET | `/admin/consultants/:id` |
| POST | `/admin/users` |
| PATCH | `/admin/bookings/:id/adjust-amounts` |
| PATCH | `/admin/properties/:id/featured` |
| PATCH | `/admin/properties/:id/commission` |
| PATCH | `/admin/reviews/:id/flag` |
| POST | `/admin/users/:id/notify` |
| GET | `/admin/users/:id/timeline` |
| GET | `/admin/messages` |
| GET | `/admin/messages/:id` |
| GET | `/admin/export/:type` |
| GET | `/admin/experience-bookings/:id` |
| POST | `/admin/payouts/batch-process` |
| GET | `/admin/email-templates` |
| GET | `/admin/email-templates/:slug` |
| GET | `/admin/analytics/financial` |
| GET | `/admin/bookings/:id/profit` |
| GET | `/admin/expenses` |
| POST | `/admin/expenses` |

### 2.23 Endpoint Summary

| Area | Endpoints |
|------|-----------|
| Auth | 27 |
| Users | 21 |
| Properties | 21 |
| Price Alerts | 3 |
| Bookings | 25 |
| Reviews | 7 |
| Messages | 10 |
| Wishlists | 10 |
| Notifications | 7 |
| Search | 3 |
| Availability | 11 |
| Amenities | 1 |
| Categories | 2 |
| Cohosts | 8 |
| Saved Searches | 4 |
| Disputes | 9 |
| Payments | 6 |
| Payouts | 7 |
| Uploads | 7 |
| Experiences | 11 |
| Experience Bookings | 11 |
| Experience Reviews | 4 |
| Consultations (public) | 3 |
| Consultations (auth) | 32 |
| Consultations (admin) | 17 |
| Admin | 72 |
| **Total** | **~339** |

---

## 3. Complete Entities List

| # | Entity Class | Table Name | Entity File |
|---|-------------|------------|-------------|
| 1 | AdminActivityLogEntity | `admin_activity_logs` | admin-activity-log.entity.ts |
| 2 | AmenityEntity | `amenities` | amenity.entity.ts |
| 3 | AuditLogEntity | `audit_logs` | audit-log.entity.ts |
| 4 | AvailabilityEntity | `property_availability` | availability.entity.ts |
| 5 | BlockedUserEntity | `blocked_users` | blocked-user.entity.ts |
| 6 | BookingStatusHistoryEntity | `booking_status_history` | booking-status-history.entity.ts |
| 7 | BookingEntity | `bookings` | booking.entity.ts |
| 8 | CategoryEntity | `categories` | category.entity.ts |
| 9 | CoHostEntity | `cohosts` | cohost.entity.ts |
| 10 | ConsultantAvailabilityEntity | `consultant_availability` | consultant-availability.entity.ts |
| 11 | ConsultantDocumentEntity | `consultant_documents` | consultant-document.entity.ts |
| 12 | ConsultantEarningEntity | `consultant_earnings` | consultant-earning.entity.ts |
| 13 | ConsultantPayoutRequestEntity | `consultant_payout_requests` | consultant-payout-request.entity.ts |
| 14 | ConsultantVacationBlockEntity | `consultant_vacation_blocks` | consultant-vacation-block.entity.ts |
| 15 | ConsultantEntity | `consultants` | consultant.entity.ts |
| 16 | ConsultationBookingEntity | `consultation_bookings` | consultation-booking.entity.ts |
| 17 | ConsultationReviewEntity | `consultation_reviews` | consultation-review.entity.ts |
| 18 | ConsultationServiceEntity | `consultation_services` | consultation-service.entity.ts |
| 19 | ConversationEntity | `conversations` | conversation.entity.ts |
| 20 | DisputeEntity | `disputes` | dispute.entity.ts |
| 21 | EarningEntity | `earnings` | earning.entity.ts |
| 22 | ExpenseEntity | `expenses` | expense.entity.ts |
| 23 | ExperienceBookingEntity | `experience_bookings` | experience-booking.entity.ts |
| 24 | ExperienceCategoryEntity | `experience_categories` | experience-category.entity.ts |
| 25 | ExperienceItineraryEntity | `experience_itinerary` | experience-itinerary.entity.ts |
| 26 | ExperiencePhotoEntity | `experience_photos` | experience-photo.entity.ts |
| 27 | ExperienceReviewEntity | `experience_reviews` | experience-review.entity.ts |
| 28 | ExperienceScheduleEntity | `experience_schedule` | experience-schedule.entity.ts |
| 29 | ExperienceEntity | `experiences` | experience.entity.ts |
| 30 | HouseRuleEntity | `property_house_rules` | house-rule.entity.ts |
| 31 | ICalSourceEntity | `property_ical_sources` | ical-source.entity.ts |
| 32 | MessageEntity | `messages` | message.entity.ts |
| 33 | NotificationEntity | `notifications` | notification.entity.ts |
| 34 | PasswordResetEntity | `password_resets` | password-reset.entity.ts |
| 35 | PaymentTransactionEntity | `payment_transactions` | payment-transaction.entity.ts |
| 36 | PayoutItemEntity | `payout_items` | payout-item.entity.ts |
| 37 | PayoutEntity | `payouts` | payout.entity.ts |
| 38 | PlatformSettingEntity | `platform_settings` | platform-setting.entity.ts |
| 39 | PriceAlertEntity | `price_alerts` | price-alert.entity.ts |
| 40 | PropertyAmenityEntity | `property_amenities` | property-amenity.entity.ts |
| 41 | PropertyPhotoEntity | `property_photos` | property-photo.entity.ts |
| 42 | PropertyPriceHistoryEntity | `property_price_history` | property-price-history.entity.ts |
| 43 | PropertyEntity | `properties` | property.entity.ts |
| 44 | ReviewEntity | `reviews` | review.entity.ts |
| 45 | SavedSearchEntity | `saved_searches` | saved-search.entity.ts |
| 46 | UserReportEntity | `user_reports` | user-report.entity.ts |
| 47 | UserSessionEntity | `user_sessions` | user-session.entity.ts |
| 48 | UserEntity | `users` | user.entity.ts |
| 49 | VerificationTokenEntity | `verification_tokens` | verification-token.entity.ts |
| 50 | WishlistItemEntity | `wishlist_items` | wishlist-item.entity.ts |
| 51 | WishlistEntity | `wishlists` | wishlist.entity.ts |

### 3.1 Entities NOT in Any Module's `TypeOrmModule.forFeature()`

These entities are registered globally in `app.module.ts` → `TypeOrmModule.forRootAsync({ entities: [...] })` but no feature module calls `TypeOrmModule.forFeature()` for them. They may be managed via TypeORM relations, QueryBuilder, or are potentially unused:

| Entity | Table | Likely Reason |
|--------|-------|---------------|
| PropertyAmenityEntity | `property_amenities` | Many-to-many join table — managed via relation decorators |
| ConsultationServiceEntity | `consultation_services` | **Not injected anywhere** — may be dead code or planned feature |
| PaymentTransactionEntity | `payment_transactions` | May be populated via QueryBuilder in PaymentsService |
| PayoutItemEntity | `payout_items` | May be populated via QueryBuilder in PayoutsService |
| BookingStatusHistoryEntity | `booking_status_history` | May be populated via QueryBuilder in BookingsService |
| PropertyPriceHistoryEntity | `property_price_history` | May be populated via QueryBuilder in PropertiesService |
| UserReportEntity | `user_reports` | May be populated via QueryBuilder in AdminService |

---

## 4. Global Configuration (`main.ts`)

| Setting | Value |
|---------|-------|
| App type | NestExpressApplication with `rawBody: true` |
| Port | 3001 |
| Global prefix | `/api` |
| Swagger | `/api/docs` — disabled when `NODE_ENV=production` |
| Helmet | Enabled with CSP (self, inline, img/media from self+data+blob) |
| CORS | Origins from `CORS_ORIGINS` env (comma-separated), credentials enabled |
| Cookie parser | Enabled |
| Compression | Enabled |
| ValidationPipe | `whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion` |
| Static assets | `/uploads` → `../uploads` directory |
| Rate limiting | ThrottlerGuard as global APP_GUARD (60s/100 requests) |
| Cache | Redis if `REDIS_URL` set, else in-memory (TTL 60s, max 200) |
| Cron | ScheduleModule.forRoot() |

### 4.1 Custom Middleware in `main.ts`

1. **Published property photo access control** — In-memory cache of published property IDs (5min TTL, max 5000). Published photos are public; draft/pending/archived require host or admin JWT.
2. **Authenticated directories** — Direct access blocked for: `/uploads/payments`, `/uploads/messages`, `/uploads/id-documents`, `/uploads/consultant-docs`, `/uploads/disputes`. Redirects to controller endpoints requiring JWT.
3. **Image optimization** — Sharp-based on-the-fly optimization for property photos. Supports query params: `?w=` (width), `?f=` (format: webp/avif/jpeg/png), `?q=` (quality 1-100).

---

## 5. Missing / Broken References

### 5.1 Guards / Interceptors / Middleware — All Defined ✅

| Guard/Interceptor | Defined In | Used By |
|-------------------|-----------|---------|
| JwtAuthGuard | `common/guards/jwt-auth.guard.ts` | 20+ controllers |
| AdminGuard | `admin/admin.guard.ts` | AdminController, ConsultationsAdminController |
| AdminIpAllowlistGuard | `admin/admin-ip-allowlist.guard.ts` | AdminController |
| CoHostGuard | `common/guards/cohost.guard.ts` | CohostsController |
| AdminLogInterceptor | `admin/admin-log.interceptor.ts` | AdminController |
| ThrottlerGuard | `@nestjs/throttler` (framework) | Global APP_GUARD + SearchController |
| CacheInterceptor | `@nestjs/cache-manager` (framework) | SearchController |
| JwtStrategy | `auth/strategies/jwt.strategy.ts` | AuthModule |
| GoogleStrategy | `auth/strategies/google.strategy.ts` | AuthModule |
| MessagesGateway | `messages/messages.gateway.ts` | MessagesModule |
| OptionalJwtGuard | `common/guards/optional-jwt.guard.ts` | **⚠ Not found in any @UseGuards()** |

### 5.2 Services — All Properly Wired ✅

Every service injected in a controller is either:
- Provided in the same module, OR
- Exported by an imported module

No missing provider errors detected.

### 5.3 Import References — All Valid ✅

All 51 entity imports in `app.module.ts` resolve to existing files in `entities/`.  
All module imports in `app.module.ts` resolve to existing `.module.ts` files.  
All service/guard/interceptor imports in module files resolve to existing `.ts` files.

---

## 6. TODO / FIXME / HACK Comments

**None found.** Searched all `*.ts` files under `packages/backend/src/` using both `Select-String` and `grep_search` with patterns `TODO|FIXME|HACK` (case-insensitive). Zero matches.

---

## 7. Module Registration Mismatches

### 7.1 Folder ↔ Module Registration

| Status | Details |
|--------|---------|
| ✅ | All 26 feature module folders have corresponding imports in `app.module.ts` |
| ✅ | `entities/` has no module (shared directory) — expected |
| ✅ | No orphan folders without module registration |
| ✅ | No phantom module imports without corresponding folders |

### 7.2 Observations

| # | Observation | Severity |
|---|------------|----------|
| 1 | **UploadsModule has no providers** — `UploadsController` uses `@InjectRepository()` directly without a service layer. Works but breaks NestJS conventions; business logic lives in the controller. | Low |
| 2 | **OptionalJwtGuard exists but appears unused** — `common/guards/optional-jwt.guard.ts` is not referenced in any `@UseGuards()` decorator across all controllers. May be dead code or used indirectly. | Low |
| 3 | **7 entities registered globally but not in any forFeature()** — See Section 3.1. `ConsultationServiceEntity` is the most suspicious — no module injects its repository. The others likely use QueryBuilder or relation-based access. | Low-Medium |
| 4 | **ConsultationsAdminController route prefix** — Uses `Controller('admin/consultations')` which means its endpoints are at `/api/admin/consultations/*`. This overlaps with AdminController's `/api/admin/*` namespace but doesn't conflict since paths differ. | Info |
| 5 | **3 @Global() modules** — CommonModule, MailModule, SmsModule are all global. Their services (CurrencyService, MailService, SmsService) are available everywhere without explicit imports. | Info |
| 6 | **ConsultationSchedulerService** is provided in ConsultationsModule but not exported. It handles scheduled tasks internally (cron). | Info |

---

## 8. Architecture Summary

```
app.module.ts
├── Framework: ConfigModule, CacheModule, ThrottlerModule, TypeOrmModule, ScheduleModule
├── Global: CommonModule (CurrencyService), MailModule (MailService), SmsModule (SmsService)
├── Auth: AuthModule (JWT + Google OAuth + TOTP)
├── Core Domain:
│   ├── UsersModule
│   ├── PropertiesModule (+ PriceAlerts)
│   ├── BookingsModule (+ Invoices)
│   ├── ReviewsModule
│   ├── MessagesModule (+ WebSocket gateway)
│   ├── WishlistsModule
│   ├── SearchModule
│   └── CategoriesModule, AmenitiesModule
├── Host Tools:
│   ├── AvailabilityModule (+ iCal sync)
│   ├── CohostsModule
│   └── PayoutsModule
├── Experiences: ExperiencesModule (3 controllers)
├── Consultations: ConsultationsModule (3 controllers + scheduler)
├── Financial: PaymentsModule (Stripe + OPay)
├── Disputes: DisputesModule
├── Admin: AdminModule (~72 endpoints)
├── Infrastructure:
│   ├── UploadsModule
│   ├── NotificationsModule (+ SSE + Push)
│   ├── SchedulerModule (cron)
│   ├── AuditLogModule
│   └── SavedSearchesModule
└── Global providers: ThrottlerGuard (APP_GUARD)

Entities: 51 | Tables: 51 | Endpoints: ~339
Controllers: 28 (across 22 files) | Services: 33 | Modules: 26 feature + 5 framework
```
