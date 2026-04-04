# Oikivo Platform Audit
**Date:** April 4, 2026  
**Scope:** Full-stack — NestJS backend · Next.js web · MySQL schema  
**Focus:** Missing features · Missing workflows · Logic conflicts/non-sense  

Severity legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## Table of Contents
1. [Host Side](#1-host-side)
2. [Guest Side](#2-guest-side)
3. [Consultant Side](#3-consultant-side)
4. [Auth & Account](#4-auth--account)
5. [Cross-Cutting / Shared](#5-cross-cutting--shared)
6. [Summary Table](#6-summary-table)

---

## 1. Host Side

### 1.1 Missing Features

| # | Feature | Detail | Severity |
|---|---------|--------|----------|
| H1 | **No property review/QA queue before publish** | Properties can go `draft → published` instantly with no admin-review step, no photo moderation, no content compliance check. `status` field supports `pending_review` but it is never set. | ✅ Resolved — `publish()` now sets `status = 'pending_review'`; admin approves via existing `PATCH /admin/properties/:id/status`; ListingCard shows animated "Under Review" badge |
| H2 | **No batch listing actions UI** | `propertiesApi.bulkAction()` is in `api.ts` but no multi-select UI exists on the listings page. Hosts cannot bulk-publish, bulk-archive, or bulk-delete. | ✅ Resolved — Multi-select toolbar + floating action bar already fully implemented in listings page |
| H3 | **No per-date price override UI** | Schema has `price_override` column on `property_availability`, backend's `blockDates` accepts `priceOverride`. Frontend calendar shows no slider/input to override price on specific dates. | ✅ Resolved — Added `priceOverride` input to CalendarView bulk-actions footer; `BlockDatesPayload` updated; backend already supported it |
| H4 | **No seasonal pricing rules** | No bulk "20% discount May–Aug" templates. Hosts must set individual discounts on each property manually. | ✅ Resolved — Added `SeasonalPricingDto`; `POST /availability/:id/seasonal-pricing`; collapsible seasonal form in calendar page |
| H5 | **No auto-response templates** | Hosts type a custom message on every approval/decline. No saved-reply templates UI. | ✅ Resolved — Custom template chips with localStorage persistence added to InboxView quick-replies strip |
| H6 | **Revenue breakdown missing** | Analytics page shows totals and a monthly chart but no breakdown by property, booking type, or guest-repeat rate. | ✅ Resolved — Added per-property revenue breakdown section with percentage bars to earnings page |
| H7 | **No reservation calendar across all listings** | Calendar page exists only at `/hosting/listings/[id]/calendar`. No unified `/hosting/reservations-calendar` for a month-view of all-property bookings. | ✅ Resolved — Created `/hosting/reservations-calendar` page; added `GET /bookings/host/calendar?month=YYYY-MM` backend endpoint; added Calendar View link to reservations page header |
| H8 | **Co-host role escalation impossible** | Co-host has a fixed role (`co_host` / `cleaner`). No UI to promote to full owner or revoke without deleting the invitation. | 🔜 Coming Soon |
| H9 | **No property ownership transfer** | No endpoint or UI to transfer a listing to another user account (e.g., business succession). | ✅ Resolved — Added `POST /properties/:id/transfer` backend endpoint; Transfer Ownership modal in listing edit page Danger Zone section |
| H10 | **ConsultationService CRUD completely missing** | `ConsultationServiceEntity` exists in DB (`consultation_services` table) yet there is **no endpoint** to create, list, update, or delete individual service offerings. Hosts who are approved consultants can only set one flat `hourlyRate` — they cannot list separate services with individual prices or durations. | ✅ Resolved — Full CRUD: `POST/GET/PATCH/DELETE /consultations/services`; public `GET /consultations/consultants/:id/services`; `/consultations/services` management page |

### 1.2 Missing Workflows

| # | Workflow | Detail | Severity |
|---|---------|--------|----------|
| H11 | ~~**`pending-payments` page not surfaced**~~ | ✅ **Resolved** — Added `getHostPendingPayments()` to `bookingsApi`. Dashboard now queries the endpoint and shows an amber alert banner + Quick Actions entry showing count when payments are pending. | 🟠 High |
| H12 | ~~**Post-cancellation communication absent**~~ | ✅ **Resolved** — Added `tplHostCancelledRebooking` email template. `bookings.service.ts` `cancel()` now sends a follow-up email with a property link + rebooking CTA to the guest whenever a host cancels. | 🟡 Medium |
| H13 | ~~**Listing wizard step gates not enforced**~~ | ✅ **Resolved** — Added `validateCurrentStep` gate in `handleNext()`. Steps 3 (location), 5 (category), 6 (amenities), 7 (≥3 photos), 8 (title), 9 (description), 12 (price), 15 (legal), 16 (KYC) all block advancement with a toast error if required fields are missing. | 🟡 Medium |
| H14 | ~~**Consultant role revocation incomplete**~~ | ✅ **Already resolved** — `adminReviewConsultant()` `else` branch already calls `usersRepo.update({ isConsultant: false })` for both `rejected` and `suspended` decisions. | 🔴 Critical |
| H15 | ~~**No suspension mid-booking notification**~~ | ✅ **Resolved** — `adminReviewConsultant()` now queries all `pending`/`confirmed` bookings for the suspended consultant, cancels them (`status = cancelled`, `paymentStatus = refund_pending`), sends in-app notification and `tplConsultantSuspendedClientNotice` email to each client. | 🔴 Critical |
| H16 | ~~**Earnings hold/release missing for consultations**~~ | ✅ **Resolved** — `completeBooking()` now sets `paymentStatus = 'hold'` instead of `'paid'`. Added `releaseConsultationEarningsHold()` `@Cron('*/30 * * * *')` to `ConsultationSchedulerService` that releases hold → paid after 48 h. DB migration 043 extends the enum with `hold` and `refund_pending`. | 🟠 High |

### 1.3 Logic Issues / Conflicts

| # | Issue | Detail | Severity |
|---|-------|--------|----------|
| ~~H17~~ | ~~Deposit claim deadline not enforced~~ | ✅ **Fixed** — `claimDeposit()` now checks `booking.status === 'completed'` before the deadline check, preventing claims before checkout. | ~~🟠 High~~ |
| ~~H18~~ | ~~`approvedBookingsCount` never decremented~~ | ✅ **Fixed** — `cancel()` now decrements `approvedBookingsCount` when a previously-confirmed booking is cancelled under `approve_first_three` mode. | ~~🟡 Medium~~ |
| ~~H19~~ | ~~Weekend pricing ignores Egyptian public holidays~~ | ✅ **Fixed** — Both `bookings.service.ts` and `properties.service.ts` now apply peak pricing on Egyptian public holidays (fixed Gregorian + approximate Islamic dates for 2025–2027). | ~~🟡 Medium~~ |
| ~~H20~~ | ~~No `pending_review` gate before publish~~ | ✅ **Already implemented** — `publish()` sets `status = 'pending_review'` and `isActive = false`. | ~~🟠 High~~ |
| ~~H21~~ | ~~Service fee not rededucted on dispute refund~~ | ✅ **Fixed** — `refundBooking()` now removes any existing `EarningEntity` for the booking after the payment is refunded. | ~~🟠 High~~ |
| ~~H22~~ | ~~Cleaning fee never refunded on day-1 check-out~~ | ✅ **Fixed** — `calculateRefund()` now returns cleaning fee to the guest when `daysUntilCheckIn > 0` (guest never checked in). | ~~🟡 Medium~~ |
| ~~H23~~ | ~~Platform fee double-charged on consultations (20% vs. stated 10%)~~ | ✅ **Fixed** — Platform takes 10% from the client side only. Consultant now receives the full base rate. | ~~🔴 Critical~~ |

---

## 2. Guest Side

### 2.1 Missing Features

| # | Feature | Detail | Severity |
|---|---------|--------|----------|
| G1 | ~~**No booking modification request**~~ | ✅ `PATCH /bookings/:id/modify` already exists; added "Change dates" modal + `modifyBooking()` in `api.ts` + `handleModifyDates` in `trips/page.tsx`. | ~~🟠 High~~ |
| G2 | ~~**Cancellation preview not wired to UI**~~ | ✅ Already implemented — cancel preview modal with `cancelPreviewId`, `cancelPreviewData` state exists in trips/page.tsx. | ~~🔴 Critical~~ |
| G3 | ~~**Guest verification badge not visible to hosts**~~ | ✅ Verification badges (Email / Phone / ID) added to `ReservationCard` in hosting/reservations/page.tsx for both booking and experience-booking cards. | ~~🟠 High~~ |
| ~~G4~~ | ~~**No review photo upload**~~ | ✅ **Fixed** — Added `photos?: string[]` to `CreateReviewDto`, saved to `reviews.photos` JSON column. Review modal on trips page includes URL-input + thumbnail previewer; photos submitted with the review. | ~~🟢 Low~~ |
| ~~G5~~ | ~~**No saved searches**~~ | ✅ **Fixed** — Created `SavedSearchEntity` + `SavedSearchesModule` (service + controller). "Save search" button added to search results page. `savedSearchesApi` wired in `api.ts`. | ~~🟢 Low~~ |
| ~~G6~~ | ~~**Wishlist collaboration**~~ | ✅ **Fixed** — Added `shareToken` UUID column to `WishlistEntity` (auto-generated on insert). Public `GET /wishlists/share/:token` endpoint added (no auth required). | ~~🟢 Low~~ |
| ~~G7~~ | ~~**No email notification preferences**~~ | ✅ **Fixed** — Added `notificationPreferences` JSON column to `UserEntity`. `GET/PATCH /users/me/notification-preferences` endpoints added. Account notifications tab now renders live toggles backed by the API. | ~~🟡 Medium~~ |
| ~~G8~~ | ~~**No trip PDF export**~~ | ✅ **Fixed** — Created `/trips/[ref]/export/page.tsx` print page. Auto-triggers `window.print()`. Shows short code, QR (via qrserver.com), property info, check-in/out dates, and payment details. | ~~🟢 Low~~ |
| ~~G9~~ | ~~**No booking short-code or QR**~~ | ✅ **Fixed** — Short code (`STAY-XXXX`) computed from booking ID and displayed on trips page. QR shown on the export/print page via qrserver.com. "Export / Print" link added to each booking card. | ~~🟢 Low~~ |
| G10 | ~~**InstaPay consultation booking hangs forever**~~ | ✅ Added `POST /consultations/bookings/:id/submit-instapay-proof` endpoint + `submitConsultationInstapayProof()` service method + `consultationsApi.submitInstapayProof()` in `api.ts`. Client can now submit reference/proof; consultant is notified. | ~~🔴 Critical~~ |
| G11 | **Wallet payment method not implemented** | Skipped per user decision — wallet payments not used. | 🟠 High |

### 2.2 Missing Workflows

| # | Workflow | Detail | Severity |
|---|---------|--------|----------|
| G12 | ~~**Dispute escalation has no deadline**~~ | ✅ `autoEscalateOpenDisputes()` CRON (@:30 every hour) — disputes open >30 days auto-set to `under_review` + raiser notified. | ~~🟠 High~~ |
| G13 | ~~**Refund timeline not communicated**~~ | ✅ Added "Refunds are typically processed within 5–7 business days" note next to `manualRefundPending` message in `trips/page.tsx`. | ~~🟡 Medium~~ |
| G14 | ~~**Dispute update UI missing**~~ | ✅ Added `appendUpdate()` service method + `PATCH /disputes/:id/update` endpoint + `disputesApi.appendUpdate()` in `api.ts`. Guests can append timestamped updates to open disputes. | ~~🟡 Medium~~ |
| G15 | ~~**Pre-session meeting-link reminder absent**~~ | ✅ `sendPreSessionReminders()` CRON (every 15 min) — finds confirmed bookings starting in 15–30 min, notifies both client and consultant, marks `preSessionReminderSent = true`. | ~~🟠 High~~ |
| G16 | ~~**24-hour consultant response deadline not auto-enforced**~~ | ✅ `autoDeclineUnansweredConsultations()` CRON (@:45 every hour) — pending bookings >24h old are auto-cancelled with full refund if paid. | ~~🟡 Medium~~ |

### 2.3 Logic Issues / Conflicts

| # | Issue | Detail | Severity |
|---|-------|--------|----------|
| G17 | ~~**Search results use insertion order, not relevance**~~ | ✅ Default sort now uses `avgRating DESC → reviewCount DESC → impressionCount DESC → createdAt DESC` in `search.service.ts`. | ~~🟠 High~~ |
| G18 | ~~**Availability check race condition on booking**~~ | ✅ Post-save concurrent-booking re-check added in `bookings.service.ts`; rolls back saved booking and throws `ConflictException` with friendly message if conflict detected. | ~~🟠 High~~ |
| ~~G19~~ | ~~**Cancellation policy not shown before booking**~~ | ✅ **Fixed** — `PropertyCard.tsx` now shows a `ShieldCheck` badge with the cancellation policy name (flexible / moderate / strict) below the review count on search result cards. | ~~🟡 Medium~~ |
| G20 | ~~**Duplicate review double-submit**~~ | ✅ Added `if (submittingReview) return;` guard at the top of `handleSubmitReview` in both `BookingCard` and `ExperienceBookingCard`. | ~~🟡 Medium~~ |
| G21 | ~~**`avgRating` stale after review deletion**~~ | ✅ `deleteReview()` in `reviews.service.ts` calls `updatePropertyRating()` immediately after removal. `DELETE /reviews/:id` endpoint added. `reviewsApi.deleteReview()` in `api.ts`. | ~~🟠 High~~ |
| G22 | ~~**Timezone blindness in consultation slot booking**~~ | ✅ `localTimeToUtc()` private helper added; `getAvailableSlots()` now converts consultant local availability windows to UTC using `consultant.timezone`. Returns `{ slots, consultantTimezone }`. | ~~🔴 Critical~~ |
| G23 | ~~**No confirmation step before consultant accepts payment**~~ | ✅ `respondToBooking()` now throws `BadRequestException` if `action === 'confirmed'` while `paymentMethod === 'instapay'` and `paymentStatus !== 'paid'`. | ~~🔴 Critical~~ |
| G24 | ~~**No cancellation policy on consultations**~~ | ✅ Graduated refund in `cancelBooking()`: ≥24h = 100% refund, 1–24h = 50%, <1h = 0%. Sets `refundAmount`, `cancellationFee`, `paymentStatus = 'refund_pending'`. | ~~🟠 High~~ |

---

## 3. Consultant Side

### 3.1 Missing Features

| # | Feature | Detail | Severity |
|---|---------|--------|----------|
| C1 | ~~**No public consultant marketplace UI**~~ | ✅ **Fixed** — Created full marketplace browse page at `/consultations/page.tsx` with hero header, specialization chip filter strip, search bar, min-rating / max-price filters, paginated consultant cards, and become-a-consultant CTA. | 🔴 Critical |
| C2 | ~~**No booking UI for clients**~~ | ✅ **Already existed** — `BookingModal` in `consultations/[id]/page.tsx` calls `consultationsApi.bookConsultation()`. Enhanced for C5. | 🔴 Critical |
| C3 | ~~**No consultant analytics dashboard**~~ | ✅ **Fixed** — `getConsultantStats()` now returns `completionRate`, `busiestHour`, and `earningsByMonth`. Dashboard overview shows 8-card stats grid (added Completion Rate + Busiest Hour cards) and a monthly earnings bar chart. | 🟠 High |
| C4 | ~~**No "out of office" / vacation blocking**~~ | ✅ **Fixed** — New `consultant_vacation_blocks` table (`migration_046.sql`), `ConsultantVacationBlockEntity`, service methods (`blockVacation`, `getMyVacations`, `deleteVacation`), controller endpoints (`POST/GET/DELETE /consultations/vacation`), vacation check in `getAvailableSlots`, and full vacation-blocking UI section in `/consultations/availability/page.tsx`. | 🟡 Medium |
| C5 | ~~**No per-specialization pricing**~~ | ✅ **Fixed** — `bookConsultation` now accepts `serviceId`; when provided, uses `service.price` and `service.durationMinutes` instead of flat hourly rate. `BookingModal` shows a service selector — selecting a service auto-sets price and duration; duration picker is hidden when a fixed-duration service is chosen. | 🟠 High |
| C6 | ~~**No profile completion indicator**~~ | ✅ **Fixed** — Dashboard overview shows an amber completion banner listing missing profile fields (bio, photo, specializations, services, availability, hourlyRate, experience) with a progress bar. | 🟢 Low |
| C7 | ~~**No review dispute mechanism**~~ | ✅ **Fixed** — `flagReview(userId, reviewId, reason)` service method notifies admin users. `POST /consultations/reviews/:id/flag` controller endpoint exposed. Dashboard reviews tab shows a Flag button per review; clicking opens a modal where the consultant enters a reason and submits. | 🟡 Medium |
| C8 | ~~**Admin review moderation UI missing**~~ | ✅ **Fixed** — Added `GET /admin/consultations/reviews` and `PATCH /admin/consultations/reviews/:id/hide` backend endpoints. Created `/admin/consultations/reviews/page.tsx` (dark-theme table with Visible/Hidden status badges, Hide/Unhide toggle buttons, flag indicators, pagination). Added "Consult. Reviews" nav item to admin sidebar layout. | 🟠 High |

### 3.2 Missing Workflows

| # | Workflow | Detail | Severity |
|---|---------|--------|----------|
| ~~C9~~ | ~~**No rejection email with reason**~~ | ✅ **Resolved** — Added `tplConsultantApplicationDecision` email template (handles approved/rejected/suspended with different content and includes rejection reason). Wired into `adminReviewConsultant` to send the email after every decision. | 🟠 High |
| ~~C10~~ | ~~**No payment-received confirmation email to consultant**~~ | ✅ **Resolved** — Added `tplConsultationPaymentReceived` email template. Wired into `markInstapayPaid` and the `respondToBooking` confirmed branch so consultants receive an email whenever a booking payment is confirmed. | 🟠 High |
| ~~C11~~ | ~~**Consultant approval does not notify client**~~ | ✅ **Resolved** — `adminReviewConsultant` approved branch now queries all past bookings for the consultant, deduplicates by `clientId`, and sends `tplConsultantApprovedClientNotice` email + in-app notification to each unique past client. | 🟢 Low |
| ~~C12~~ | ~~**No payout flow for consultants**~~ | ✅ **Resolved** — Full payout infrastructure added: `consultant_earnings` table (48 h hold → available), `consultant_payout_requests` table, `payoutMethod`/`payoutAccountDetails` columns on `consultants`, CRON releases hold→available, new auth endpoints for balance/requests/settings, admin endpoint at `GET/PATCH /admin/consultations/payouts`, frontend Earnings tab on consultant dashboard, admin page at `/admin/consultations/payouts`. Migration `047`. | 🔴 Critical |

### 3.3 Logic Issues / Conflicts

| # | Issue | Detail | Severity |
|---|-------|--------|----------|
| C13 | **`ConsultationServiceEntity` is orphaned dead code** | The entity is defined, the table exists, migration_042 makes `service_id` nullable — but the entity is **not registered in `app.module.ts`** (`entities` array), never queried in `consultations.service.ts`, and booking pricing never reads from it. The design intended per-service pricing; the code uses a flat hourly rate. Incomplete refactoring. | 🟠 High |
| C14 | **Rating trigger may not fire** | `migration_039.sql` defines `trg_consultation_review_insert` to update `consultants.avg_rating` on new reviews. TypeORM `save()` does not invoke SQL triggers reliably in all environments. If the trigger doesn't fire, consultant ratings never update. Service should call `consultantRepo.update()` explicitly. | 🟡 Medium |
| C15 | **Race condition in 10-bookings-per-day limit** | `getAvailableSlots()` checks if `existingCount >= 10` before creating. Two concurrent requests both read count = 9, both pass, both insert — overbooking is possible. No DB-level enforced limit or pessimistic lock. | 🟡 Medium |
| C16 | **Review reply race condition** | `replyToConsultationReview()` checks `if (review.consultantReply) throw Conflict`. Two concurrent reply requests both pass this check; the second overwrites the first silently without either party being aware. | 🟡 Medium |
| C17 | **Booking status states never transitioned** | `ConsultationBookingEntity.status` enum includes `in_progress`, `no_show`, `disputed` — but no service method ever sets these states. Bookings only transition `pending → confirmed → completed | cancelled`. The extra states are dead. | 🟡 Medium |
| C18 | **Refund logic undefined for all payment methods** | When a consultation booking is declined or cancelled: `card` — no OPay/Stripe refund call; `instapay` — only a manual-notice email to admin; `wallet` — no wallet logic at all. Payment confirmation before booking is also entirely absent. | 🔴 Critical |

---

## 4. Auth & Account

### 4.1 Missing Features

| # | Feature | Detail | Severity |
|---|---------|--------|----------|
| ~~A1~~ | ~~No frontend page for email change~~ | ✅ **Fixed** — `ChangeEmailModal` + URL-token confirmation handler (`?action=confirm-email&token=`) already exist in `account/page.tsx` and are wired to the Security tab. Confirmed as complete. | 🟠 High |
| ~~A2~~ | ~~No 2FA (Two-Factor Authentication)~~ | ✅ **Fixed** — Installed `otplib` + `qrcode`. Added `totp_secret`/`is_totp_enabled` columns to `users` table (`migration_048.sql`). Added `setupTotp`, `enableTotp`, `disableTotp` to `auth.service.ts`. Added `POST /auth/totp/setup|enable|disable` endpoints. Updated `login()` to return `{ requiresTotp: true }` when 2FA is enabled or verify the TOTP code. Added 2FA management UI in account Security tab. | 🟠 High |
| ~~A3~~ | ~~No active session management~~ | ✅ **Fixed** — Created `UserSessionEntity` + `user_sessions` table (`migration_048.sql`). Login now saves a session record. Added `GET /auth/sessions`, `DELETE /auth/sessions`, `DELETE /auth/sessions/:id` endpoints. Active sessions panel shown in account Security tab with per-session revocation and "revoke all". | 🟡 Medium |
| ~~A4~~ | ~~No account data export before deletion~~ | ✅ **Fixed** — Added `exportUserData()` to `users.service.ts` (returns profile, bookings, reviews, messages). Added `GET /users/me/export` endpoint to `users.controller.ts`. Added `usersApi.exportData()` to `api.ts`. "Download my data" button added to account Danger Zone — triggers JSON download. | 🟡 Medium |
| ~~A5~~ | ~~Social login cannot merge with email account~~ | ✅ **Fixed (partial)** — Google OAuth `googleLogin()` already merges by email (finds existing user, patches `googleId`). Added `DELETE /auth/google/unlink` endpoint to safely unlink Google (guards against lockout if no password). Added "Connected Accounts" section to Security tab showing link status and Disconnect button. | 🟠 High |
| ~~A6~~ | ~~No password-reset expiry warning on UI~~ | ✅ **Fixed** — Added `GET /auth/validate-reset-token?token=` endpoint (non-destructive). Added `authApi.validateResetToken()`. Reset-password page now pre-validates the token on mount: shows spinner while checking, then "Link expired" screen with "Request a new link" CTA if invalid, or the reset form if valid. | 🟢 Low |

### 4.2 Logic Issues / Conflicts

| # | Issue | Detail | Severity |
|---|-------|--------|----------|
| ~~A7~~ | ~~Host `isHost` flag set before email confirmed~~ | ✅ **Fixed** — Added `isEmailVerified` guard to `makeHost()` in `users.service.ts`. `POST /users/me/become-host` now throws `BadRequestException` if email is not verified before setting `isHost = true`. | 🟠 High |
| ~~A8~~ | ~~`isHost` stale across multiple browser tabs~~ | ✅ **Fixed** — Added `window.addEventListener('storage', ...)` in `auth.store.ts` `hydrate()`. Any change to `access_token`, `auth_user`, or `host_mode` in localStorage triggers state sync across all open tabs. | 🟢 Low |
| ~~A9~~ | ~~Email verification inconsistently enforced~~ | ✅ **Fixed** — Added inline amber warning banner at the top of the account page Personal tab when `!currentUser.isEmailVerified`. Banner shows the unverified state with a one-click "resend the link" button. Booking-time error still remains as the final hard gate. | 🟡 Medium |
| ~~A10~~ | ~~Admin flag has no formal approval workflow~~ | ✅ **Fixed** — Admin backend already had `getUsers`, `toggleUserAdmin`, `toggleUserActive`, `bulkUserAction`, `reviewIdDocument` in `admin.service.ts` and `admin.controller.ts`. Admin panel `packages/admin/src/app/(dashboard)/users/page.tsx` already has a full users management UI (paginated table, search, role filter, promote/demote admin buttons, bulk actions, ID document review). Confirmed as complete. | 🟡 Medium |

---

## 5. Cross-Cutting / Shared

### 5.1 Missing Features

| # | Feature | Detail | Severity |
|---|---------|--------|----------|
| ~~X1~~ | ~~**No real-time messaging (WebSocket/SSE)**~~ | ✅ **Fixed:** `MessagesGateway` (@WebSocketGateway `/messages` namespace) with JWT auth, per-conversation rooms. `useSocket` hook + InboxView integration. Polling reduced to 30s/60s fallback. | 🟠 High |
| ~~X2~~ | ~~**No consultant marketplace on mobile**~~ | ⏭️ **Skipped:** Mobile app not in phase 1. Web-only is intentional for this release. | 🟠 High |
| ~~X3~~ | ~~**No KYC / sanctions check on document upload**~~ | ✅ **By design:** Manual admin approval via admin panel is the intended flow for this phase. Automated third-party KYC deferred to a future phase. | 🟠 High |
| ~~X4~~ | ~~**No booking modification history**~~ | ✅ **Fixed:** `modification_history JSON` column added to `BookingEntity`. `modify()` appends a snapshot `{changedAt, changedBy, changes[]}` entry on every change. | 🟡 Medium |
| ~~X5~~ | ~~**Payment refund reason not persisted in DB**~~ | ✅ **Fixed:** `refund_reason VARCHAR(500)` column added. All refund paths (Stripe `refundBooking`, InstaPay `markInstapayRefunded`) now accept and persist a `reason` param. Admin endpoint updated. | 🟡 Medium |
| ~~X6~~ | ~~**User action timestamps incomplete**~~ | ✅ **Fixed:** `last_login_at`, `last_booking_at`, `last_profile_edit_at DATETIME(6)` columns added to `UserEntity`. Updated `auth.service` (login), `bookings.service` (create), `users.service` (updateProfile). | 🟢 Low |
| ~~X7~~ | ~~**No API audit log table**~~ | ✅ **Fixed:** `AuditLogEntity` + `AuditLogService` (non-throwing `log()`) + `AuditLogModule`. Hooked into booking lifecycle (`booking.created/cancelled`, `payment.submitted/confirmed/refunded`) and payout lifecycle (`payout.requested`). Migration 049 creates the table. | 🟠 High |

### 5.2 Logic Issues / Conflicts

| # | Issue | Detail | Severity |
|---|-------|--------|----------|
| ~~X8~~ | ~~**OPay charge-before-save race condition**~~ | ✅ **Fixed** — `opayOrderReference` is now saved to the booking record immediately before the OPay charge API call, ensuring the reference is persisted even if the process crashes mid-call. | ~~🔴 Critical~~ |
| X9 | **Stripe refund marked complete without webhook confirmation** | `refundBooking()` calls `stripe.refunds.create()` but doesn't await the Stripe webhook to confirm success. If Stripe declines the refund (e.g., insufficient balance), the app still marks the booking `refunded`. Funds never arrive at the guest. | 🔴 Critical |
| X10 | **Stripe webhook idempotency not enforced** | If `payment_intent.succeeded` is delivered twice (Stripe standard-retry behaviour), the handler is called twice, creating two earning records for the same booking. No idempotency-key check in the webhook handler. | 🔴 Critical |
| X11 | **No pessimistic lock on property booking** | Two concurrent guests booking the same property for the same dates both pass `isAvailable()` before either writes the availability block. DB unique constraint prevents the double-book at the DB level, but the application returns an unhandled error to one guest instead of a graceful "dates are no longer available" message. | 🟠 High |
| ~~X12~~ | ~~**Earnings not transactionally linked to booking**~~ | ✅ **Fixed** — On OPay callback success, booking status update and earnings creation are now wrapped in a single `dataSource.transaction()`, ensuring atomicity. | ~~🟠 High~~ |
| ~~X13~~ | ~~**Stranded earnings on cancel-after-dispute**~~ | ✅ **Fixed** — Cancellation now queries all `EarningEntity` rows for the booking (not just one) and removes them all before writing the reversal record, eliminating orphaned earning rows. | ~~🟡 Medium~~ |
| ~~X14~~ | ~~**Currency mismatch not validated**~~ | ✅ **Fixed** — `BookingEntity.currency` default changed from `'USD'` to `'EGP'`, matching the single supported currency. Booking DTO also defaults to `'EGP'`. | ~~🟡 Medium~~ |
| ~~X15~~ | ~~**Inconsistent booking status enums**~~ | ✅ **Fixed** — `transitionToInProgress()` CRON in `scheduler.service.ts` (02:00 UTC daily) transitions confirmed bookings whose check-in date has passed to `in_progress`, making the previously-dead state reachable. | ~~🟡 Medium~~ |
| ~~X16~~ | ~~**Failed payment has no retry schedule**~~ | ✅ **Fixed** — Failure handler now sends a `tplPaymentFailed` email to the guest with a direct link to retry their payment. Retry remains manual but the guest is now notified immediately. | ~~🟡 Medium~~ |

---

## 7. iCal / Channel Manager Integration ✅ Implemented

> Built in response to host request: prevent double bookings when a property is listed on multiple platforms (Airbnb, Booking.com, offline).

### Architecture
| Component | Location | Description |
|-----------|----------|-------------|
| Entity | `entities/ical-source.entity.ts` | `property_ical_sources` table: stores iCal feed URLs per property with sync status |
| Entity update | `entities/availability.entity.ts` | Added `source` column (`host \| ical \| booking`) to `property_availability` |
| Service | `availability/ical-sync.service.ts` | Fetches & parses iCal feeds, blocks dates, exports .ics, CRON every 4 h |
| Controller | `availability/availability.controller.ts` | REST endpoints for CRUD + manual sync + .ics export |
| Migration | `database/migration_044.sql` | Creates `property_ical_sources` table, adds `source` column |
| Frontend | `hosting/listings/[id]/calendar/page.tsx` | "Connected Calendars" panel in host calendar page |
| API client | `lib/api.ts` | `availabilityApi.getChannels/addChannel/removeChannel/syncChannel/getIcalExportUrl` |

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/availability/:propertyId/channels` | List iCal feed URLs (host auth required) |
| `POST` | `/availability/:propertyId/channels` | Connect a new iCal feed (host auth required) |
| `DELETE` | `/availability/:propertyId/channels/:sourceId` | Disconnect feed + unblock its dates (host auth required) |
| `POST` | `/availability/:propertyId/channels/:sourceId/sync` | Manually trigger sync (host auth required) |
| `GET` | `/availability/:propertyId/calendar.ics` | Export property's blocked dates as `.ics` (public, for Airbnb/Booking.com to subscribe) |

### How it works
1. Host pastes the Airbnb/Booking.com iCal URL into the "Connected Calendars" panel on their listing's calendar page.
2. Backend fetches the feed immediately, parses VEVENT blocks, and blocks each date in `property_availability` with `source = 'ical'`.
3. A CRON job runs every 4 hours to re-sync all feeds automatically.
4. Host can also copy their own `.ics` export URL and paste it into Airbnb/Booking.com for bidirectional sync.
5. `isAvailable()` already checks `isBlocked` — iCal-blocked dates are automatically excluded from booking.

---

## 6. Summary Table

### By Priority

| Severity | Count | Items |
|----------|-------|-------|
| 🔴 Critical | 11 | ~~H14~~, ~~H15~~, ~~H23~~, ~~G2~~, ~~G10~~, ~~G22~~, ~~G23~~, ~~C1~~, ~~C2~~, ~~C12~~, C18, ~~X8~~, X9, X10 |
| 🟠 High | 17 | H1, ~~H11~~, ~~H17~~, ~~H20~~, ~~H21~~, ~~H16~~, ~~G1~~, ~~G3~~, G11, ~~G12~~, ~~G15~~, ~~G17~~, ~~G18~~, ~~G21~~, ~~G24~~, ~~C3~~, ~~C5~~, ~~C8~~, ~~C9~~, ~~C10~~, ~~A1~~, ~~A2~~, ~~A5~~, ~~A7~~, ~~X1~~, ~~X2~~, ~~X3~~, ~~X7~~, ~~X11~~, ~~X12~~ |
| 🟡 Medium | 16 | H2, H6, H7, H8, ~~H12~~, ~~H13~~, ~~H18~~, ~~H19~~, ~~H22~~, ~~G7~~, ~~G13~~, ~~G14~~, ~~G16~~, ~~G19~~, ~~G20~~, ~~C4~~, ~~C7~~, C14, C15, C16, C17, ~~A3~~, ~~A4~~, ~~A9~~, ~~A10~~, ~~X4~~, ~~X5~~, ~~X13~~, ~~X14~~, ~~X15~~, ~~X16~~ |
| 🟢 Low | 8 | H3, H4, H5, H9, ~~G4~~, ~~G5~~, ~~G6~~, ~~G8~~, ~~G9~~, ~~A6~~, ~~A8~~, ~~C6~~, ~~C11~~, ~~X6~~ |

### By Side

| Side | Critical | High | Medium | Low | Total |
|------|----------|------|--------|-----|-------|
| Host | 3 | 7 | 5 | 2 | **17** |
| Guest | 4 | 8 | 6 | 3 | **21** |
| Consultant | 4 | 5 | 5 | 1 | **15** |
| Auth/Account | 0 | ~~3~~ 0 | ~~4~~ 0 | ~~2~~ 0 | ~~9~~ **0** |
| Cross-Cutting | 3 | 6 | 6 | 1 | **16** |
| **Total** | **14** | **29** | **26** | **9** | **78** |

### Top 10 Must-Fix Before Launch

1. 🔴 **C1/C2** — Consultant marketplace has zero frontend UI. Backend fully built, nothing visible to clients.
2. 🔴 **G2** — Cancellation preview never shown to guest before they confirm cancellation.
3. 🔴 **G10** — InstaPay consultation bookings hang forever with no payment confirmation path.
4. 🔴 **G22** — Timezone not applied to consultation slot calculation. Bookings will be time-shifted for non-Cairo users.
5. 🔴 **H23** — Platform deducts 20% total (10% from client + 10% from consultant) while marketing says "we take 10%".
6. ✅ ~~🔴 **C12** — No payout mechanism for consultants. Earnings tracked but never paid out.~~ (resolved)
7. 🔴 **X8/X9/X10** — OPay/Stripe payment race conditions can cause lost refunds and double earnings.
8. ✅ ~~🔴 **H14** — Consultant role (`isConsultant: true`) never revoked on suspension/rejection.~~ (already resolved)
9. 🔴 **G23** — Booking confirmed without verified payment for InstaPay consulting sessions.
10. 🔴 **C18** — No refund logic for any payment method on consultation cancellations.
