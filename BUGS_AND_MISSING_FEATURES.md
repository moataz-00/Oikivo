# Journey Stay — Bugs, Missing Features & API Gaps

**Audit Date:** March 26, 2026  
**Last Updated:** Session 5 — Earnings & analytics nav links, impression tracking, dispute navigation, `in_progress` mid-stay UI, guest booking confirmation email  
**Scope:** Full-stack audit — NestJS backend + Next.js web + React Native mobile  
**Legend:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low · ✅ Fixed · ⏸️ Deferred

---

## Table of Contents

1. [Payment Errors — OPay](#1-payment-errors--opay)
2. [Payment Errors — InstaPay](#2-payment-errors--instapay)
3. [Payment Errors — Stripe (Deferred)](#3-payment-errors--stripe-deferred)
4. [Refund Process Gaps](#4-refund-process-gaps)
5. [Booking & Cancellation Bugs](#5-booking--cancellation-bugs)
6. [Host Side Missing Features](#6-host-side-missing-features)
7. [Guest Side Missing Features](#7-guest-side-missing-features)
8. [Payout Process](#8-payout-process)
9. [Authentication & Security](#9-authentication--security)
10. [Notifications](#10-notifications)
11. [Missing API Endpoints](#11-missing-api-endpoints)
12. [Long-term Rent Feature](#12-long-term-rent-feature)
13. [Summary Table](#13-summary-table)

---

## 1. Payment Errors — OPay

### ✅ 1.1 Callback Signature Bypass (FIXED)

**File:** `packages/backend/src/payments/payments.service.ts`  
**Fix applied:** Changed `if (receivedSig && receivedSig !== expected)` → `if (!receivedSig || receivedSig !== expected)`. Now rejects requests with absent or mismatched Authorization/merchantId headers.

---

### ✅ 1.2 OPay PENDING Status Treated as Payment Failure (FIXED)

**File:** `packages/backend/src/payments/payments.service.ts`  
**Fix applied:** Added explicit `PENDING` branch returning `{ status: 'pending' }`. Return type updated to `'success' | 'pending' | 'failed'`.

---

### ✅ 1.3 OPay Shown to International Users (FIXED)

**File:** `packages/web/src/components/payment/PaymentMethodModal.tsx`  
**Fix applied:** Wrapped OPay Card button in `{isEgypt && (...)}` — now only visible to Egypt timezone users.

---

### ✅ 1.4 No Rate Limiting on OPay Card Endpoint (FIXED)

**File:** `packages/backend/src/payments/payments.controller.ts`  
**Fix applied:** Added `@Throttle({ default: { limit: 5, ttl: 60000 } })` to the `opayCard` endpoint.

---

## 2. Payment Errors — InstaPay

### ✅ 2.1 Host Cannot Confirm Their Own Guest's Payment (FIXED)

**File:** `packages/backend/src/bookings/bookings.controller.ts` + `bookings.service.ts`  
**Fix applied:** `confirm-payment` and `decline-payment` routes now accept `userId` and `isAdmin`. Service performs ownership check — host can confirm/decline for their own properties; admins bypass. `admin.service.ts` updated to call `confirmPayment(id, 0, true)`.

---

### ✅ 2.2 No Host Endpoint to See Pending InstaPay Submissions (FIXED)

**File:** `packages/backend/src/bookings/bookings.controller.ts`  
**Fix applied:** Added `getHostPendingPayments(hostId)` to `bookings.service.ts` — queries `paymentStatus = 'submitted'` for the authenticated host's properties with `property` + `guest` relations. New `GET /bookings/host/pending-payments` endpoint added to the controller.

---

### ✅ 2.3 No Admin View for Cancelled InstaPay Bookings Needing Manual Refund (FIXED)

**File:** `packages/backend/src/admin/admin.controller.ts` + `packages/admin/src/app/(dashboard)/payments/instapay-refunds/page.tsx`  
**Fix applied:** Added `getInstapayRefundsPending()` to `admin.service.ts` — QueryBuilder filtering `status='cancelled' AND paymentMethod='instapay' AND paymentStatus='paid'` with `property` + `guest` joins, ordered by `cancelledAt DESC`. New `GET /admin/payments/instapay-refunds-pending` endpoint added. Admin panel page created with dark-themed table showing booking ID, guest info, property, stay dates, refund amount (amber), and cancelled-by info. "InstaPay Refunds" nav item added with `Banknote` icon.

---

## 3. Payment Errors — Stripe (Deferred)

> **Note:** Stripe is currently disabled in the frontend. All Stripe bugs below are **deferred** until Stripe is re-enabled. The backend Stripe integration is functional but unreachable from the UI.

### ⏸️ 3.1 `payment_intent.payment_failed` — Booking State Not Updated (Deferred)

**File:** `packages/backend/src/payments/payments.service.ts`

```ts
case 'payment_intent.payment_failed': {
  this.logger.warn(`Payment failed for intent ${intent.id}: ...`);
  break; // ← nothing else
}
```

**Bug:** The booking's `paymentStatus` is never updated to `'failed'`. No notification is sent to the guest. The booking appears unchanged — stuck in `pending` payment state indefinitely with no user-facing feedback.

**Fix:** Look up the booking by `stripePaymentIntentId`, update `paymentStatus = 'failed'`, send a push/email notification to the guest.

---

### 🟡 3.2 `charge.refunded` Is a No-Op for Admin-Issued Refunds

**File:** `packages/backend/src/payments/payments.service.ts`

```ts
case 'charge.refunded': {
  // Handled by refundBooking — no further action needed
  break;
}
```

**Bug:** If a Stripe admin issues a refund directly from the Stripe Dashboard (bypassing the app's `/payments/refund` endpoint), the booking's `paymentStatus` is never updated to `'refunded'`. It stays permanently at `'paid'` in the DB.

**Fix:** Handle `charge.refunded` by finding the booking via `stripePaymentIntentId` and updating `paymentStatus = 'refunded'`.

---

### 🟠 3.3 No Handler for `charge.dispute.created` (Chargebacks)

**File:** `packages/backend/src/payments/payments.service.ts` — event unhandled

**Bug:** Stripe sends `charge.dispute.created` when a cardholder initiates a chargeback. This event is completely unhandled — no DB update, no admin alert, no booking freeze, no evidence collection trigger. Chargebacks silently reverse funds with zero platform visibility.

**Fix:** Handle the event: freeze the booking, notify the admin, log the dispute in the DB.

---

### 🟠 3.4 Host Can Issue Full Stripe Refund Bypassing Cancellation Policy

**File:** `packages/backend/src/payments/payments.service.ts`

```ts
if (booking.guestId !== userId && booking.hostId !== userId) {
  throw new ForbiddenException('Not authorized');
}
// ← Host reaches here and can trigger full refund with no policy check
```

**Bug:** The `/payments/refund` endpoint allows the host to trigger a direct Stripe refund for the full booking amount, bypassing `calculateRefund()`. A host can issue a 100% refund even in a "no refund" cancellation policy window — no admin approval required.

**Fix:** Remove host permission from this endpoint, or enforce policy calculation before allowing the refund.

---

### 🟡 3.5 Stripe Webhook — Silent No-Op If `rawBody` Unavailable

**File:** `packages/backend/src/payments/payments.controller.ts`

```ts
const payload = req.rawBody;
if (!payload) {
  return { received: true }; // no-op
}
```

**Bug:** If `rawBody` is unavailable (middleware conflict, reverse proxy stripping body), the webhook returns `200 OK` without processing. Stripe marks the delivery successful and never retries. Events are permanently lost.

**Fix:** Return `400 Bad Request` so Stripe retries delivery.

---

### 🟠 3.6 Stripe Payment Method Disabled in Frontend

**File:** `packages/web/src/components/payment/PaymentMethodModal.tsx`

```tsx
{/* ── Stripe (disabled — re-enable by restoring this block when Stripe is configured)
<button onClick={() => setMethod('stripe')} ...
```

**Bug:** The Stripe option is entirely commented out. International guests who cannot use OPay (Egypt-only) and don't have an Egyptian bank account (InstaPay) have **no way to pay at all**. The backend Stripe integration is complete and functional but unreachable from the UI.

**Fix:** Uncomment the Stripe button and set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in the environment.

---

## 4. Refund Process Gaps

### ✅ 4.1 Partial Cancellation — Entire Host Earning Record Is Deleted (FIXED)

**File:** `packages/backend/src/bookings/bookings.service.ts`  
**Fix applied:** After removing the existing earning, a new earning record is created for `hostRetains` amount (if > 0) with the correct `pending`/`available` status based on the payout availability date.

---

### ✅ 4.2 InstaPay Refund — No Automated Money Return, No Workflow (FIXED)

**File:** `packages/backend/src/bookings/bookings.service.ts`  
**Fix applied:** `cancel()` now includes an InstaPay block: when `paymentMethod === 'instapay' && paymentStatus === 'paid' && refundAmount > 0`, it sends `tplInstapayRefundPending` email to the guest (amber-themed, explains 2–3 business day manual refund timeline) and creates an `instapay_refund_pending` in-app notification for every admin user. Admin panel dashboard added per §2.3 fix. `refundBooking()` method added for admin-triggered full refunds — tries Stripe then OPay then falls back to InstaPay manual flow.

---

### 🔴 4.3 Experience Booking Cancellation — Zero Refund Logic

**File:** `packages/backend/src/experiences/experience-bookings.service.ts`

**Bug:** There is no `calculateRefund()` equivalent for experience bookings. When cancelled:
- No OPay refund is triggered
- No Stripe refund is triggered  
- `paymentStatus` field is not updated
- Guests who paid for an experience receive no refund of any kind — money is simply retained

**Fix:** Port the same cancellation/refund logic from `bookings.service.ts` to `experience-bookings.service.ts`.

---

### ✅ 4.4 Dispute Resolution Triggers No Financial Action (FIXED)

**File:** `packages/backend/src/disputes/disputes.service.ts`  
**Fix applied:** `resolveDispute()` now performs financial actions automatically:
- `resolved_for_guest` → calls `this.bookingsService.refundBooking(dispute.bookingId)` (handles Stripe/OPay/InstaPay, logs on failure without blocking resolution)
- `resolved_for_host` → `earningsRepo.update({ bookingId, status: 'pending' }, { status: 'available' })` to unlock held payout

`DisputesModule` updated to import `EarningEntity` and `BookingsModule`. Constructor updated with `BookingsService` and `EarningRepository` injection.

---

## 5. Booking & Cancellation Bugs

### ✅ 5.1 No CRON — Bookings Never Auto-Complete, Earnings Never Release (FIXED)

**File:** `packages/backend/src/scheduler/scheduler.service.ts` *(NEW)*  
**Fix applied:** New `SchedulerModule` + `SchedulerService` created. `@nestjs/schedule` package installed. `@Cron('0 2 * * *')` daily job at 02:00:
1. **`transitionToInProgress`** — sets `confirmed` → `in_progress` for bookings where `checkIn ≤ today`
2. **`autoCompleteBookings`** — sets `in_progress` → `completed` for bookings where `checkOut < today`; sends `review_request` notifications to guest and host
3. **`releaseEarnings`** — updates `pending` earnings with `availableAt ≤ now` → `available`

`SchedulerModule` imported into `app.module.ts`. Resolves §8.2 as well.

---

### ✅ 5.2 Mid-Stay Host Cancellation — No Prorated Earning for Delivered Nights (FIXED)

**File:** `packages/backend/src/bookings/bookings.service.ts` + `packages/backend/src/entities/booking.entity.ts`  
**Fix applied:**
- `in_progress` added to `BookingEntity` status enum: `['pending','confirmed','in_progress','completed','cancelled','declined']`
- `migration_028.sql` created: `ALTER TABLE bookings MODIFY COLUMN status ENUM(...)` with new value
- `calculateProratedRefund(booking)` added: calculates `deliveredNights = today − checkIn`; host retains `deliveredNights × pricePerNight + cleaningFee`; guest refunded remaining nights + proportional taxes
- `cancel()` now calls `calculateProratedRefund()` instead of `calculateRefund()` when `booking.status === 'in_progress' && cancelledBy === 'host'`
- CRON (§5.1) transitions bookings from `confirmed` → `in_progress` daily at check-in date

---

### 🔴 5.3 Experience Booking — No Payment or Refund Integration

As documented in §4.3 — experience bookings have no payment confirmation, no Stripe/OPay charge hook, and no refund on cancellation. The entire payment flow for experiences is disconnected.

---

## 6. Host Side Missing Features

### ✅ 6.1 Property Publishing — Admin Review Queue Added

**File:** `packages/backend/src/properties/properties.service.ts`

```ts
property.status = 'published';
property.isActive = true;
return this.propertiesRepo.save(property); // goes live immediately
```

**Bug:** Once a host passes profile verification (email + phone + avatar + ID approved), their listing goes **live instantly** with no content moderation. No `pending_review` step, no admin queue, no photo review. Any verified host can publish listings with any content immediately.

**Fix applied:** `publish()` now sets `status = 'pending_review'` and `isActive = false`. Listing stays hidden until an admin explicitly approves it via `PATCH /admin/properties/:id/status`. The status enum now includes `pending_review` (migration_026.sql). Admin service and controller updated to filter and toggle `pending_review` properties.

---

### ✅ 6.2 CoHostGuard Created and Applied

**File:** `packages/backend/src/cohosts/cohosts.service.ts`

**Bug:** `CoHostEntity` has a `role` field and the invite/accept flow works. However, there is no guard, no middleware, and no service-level check that grants a co-host access to a property's reservations, calendar, messages, or earnings under their own JWT. Co-hosts are invited and accept — but gain no actual access to anything.

**Fix applied:** `CoHostGuard` created at `src/common/guards/cohost.guard.ts`. Checks that the requesting user is either the property owner (`property.hostId === user.id`) or has an accepted co-host record. Applied to co-host management endpoints and registered in `CohostsModule`.

---

### ✅ 6.3 No Host Payout History or Earnings Breakdown in Dashboard (FIXED)

**File:** `packages/web/src/app/[locale]/hosting/page.tsx` + `packages/web/src/app/[locale]/hosting/earnings/page.tsx`

**Fix applied:** The full earnings page at `/hosting/earnings` was already built with per-booking earnings breakdown (pending/available/paid status), monthly chart, and payout history with transfer confirmation dates. Fixed the missing navigation:
- "💰 Earnings & Payouts" added to hosting dashboard quick actions linking to `/hosting/earnings`
- Earnings stat card (`This month earnings`) is now a clickable link to `/hosting/earnings`

Payout process remains manual via admin dashboard. Automated payout API integration is deferred.

---

### ✅ 6.4 No Listing Performance Analytics (FIXED)

**File:** `packages/backend/src/entities/property.entity.ts`, `packages/backend/src/search/search.service.ts`, `packages/backend/src/bookings/bookings.service.ts`, `packages/web/src/app/[locale]/hosting/analytics/page.tsx`

**Fix applied:** Full analytics pipeline implemented:
- `impressionCount` column added to `PropertyEntity` (`migration_029.sql`)
- `search.service.ts`: fire-and-forget bulk `impression_count + 1` for every property returned in a search result
- `getHostAnalytics()`: now returns `impressions` per property alongside `views`
- Analytics page per-listing breakdown now shows: impressions, **CTR** (views ÷ impressions × 100%), views, and **booking conversion** (bookings ÷ views × 100%)
- Analytics dashboard already linked from hosting quick actions (`/hosting/analytics`)

---

## 7. Guest Side Missing Features

### ✅ 7.1 No Dispute Status Tracking Page (FIXED)

**File:** `packages/web/src/app/[locale]/trips/page.tsx`, `packages/web/src/app/[locale]/trips/disputes/`

**Fix applied:** Full dispute tracking was already built (controller `GET /disputes`, `GET /disputes/:id`, pages at `/trips/disputes` and `/trips/disputes/[id]` with timeline stepper). Missing was the navigation entry point. Fixed:
- "My Disputes" button added to the trips page header — shows count badge (amber) when user has active disputes, neutral link when no disputes
- Per-booking "View dispute" links already present in `BookingCard` when an existing dispute exists

---

### ✅ 7.2 No Mid-Stay Issue Reporting Flow (FIXED)

**File:** `packages/web/src/app/[locale]/trips/page.tsx`, `packages/web/src/types/index.ts`

**Fix applied:**
- `'in_progress'` added to `BookingStatus` type
- `statusColors` updated to display `in_progress` as `'success'` badge (same as confirmed)
- `canCancelStay` updated: `in_progress` bookings now show the Cancel button (for prorated refund)
- **"Report a problem during your stay"** CTA (amber, `AlertTriangle` icon) now appears on `in_progress` bookings, linking to `/trips/dispute/[bookingId]`
- Pre-existing: `confirmed` bookings where `checkIn ≤ today` also show "Report a problem" (unchanged)

---

### ✅ 7.3 No Booking Confirmation Email for Guest (FIXED)

**File:** `packages/backend/src/bookings/bookings.service.ts`

**Fix applied:** Guest email is now sent correctly in all scenarios:
- **Non-instant-book** (status = `pending`): `tplBookingRequestSubmitted` email sent on booking creation — confirms request was received, shows cancellation policy, links to trips page ✅
- **Instant-book** (status = `confirmed`): now correctly sends `tplBookingConfirmed` email (with 🎉 header, booking reference, dates, total, "Your stay is confirmed" messaging) instead of the incorrect "Awaiting host confirmation" email
- **Host-confirmed** (pending → confirmed): `confirm()` already sends `tplBookingConfirmed` to guest ✅

---

### ✅ 7.4 Review Request Prompt After Stay Completion

**File:** `packages/backend/src/bookings/bookings.service.ts`

```ts
async complete(bookingId) {
  await this.bookingsRepo.update(bookingId, { status: 'completed' });
  return this.findOne(bookingId);
  // ← No notification, no email, no review prompt
}
```

**Bug:** When a booking is completed, no review-request notification or email is sent to the guest. Hosts also receive no prompt to review the guest. Review rates will be low.

**Fix applied:** `complete()` now loads the full booking (with `guest` and `property` relations), then sends two non-blocking notifications: guest receives a `review_request` notification ("How was your stay?") and host receives a `review_request` notification ("Review your guest").

---

### 🟡 7.5 No In-App Messaging Notifications (Real-Time)

**File:** `packages/backend/src/app.module.ts` — no WebSocket gateway

**Bug:** There is no WebSocket or Server-Sent Events gateway. Guests and hosts using the messaging feature must manually refresh the conversation thread to see new messages. No unread message count badge updates in real-time.

---

## 8. Payout Process

### 🔴 8.1 Payout Is a DB Record Only — No Real Money Transfer

**File:** `packages/backend/src/payouts/payouts.service.ts`

```ts
const payout = await this.payoutsRepo.save(
  this.payoutsRepo.create({ hostId, amount, method, accountDetails, status: 'pending' }),
);
// Marks earnings as 'paid' (FIFO)
// Sends confirmation email
return payout; // ← no API call to any transfer service
```

**Bug:** `requestPayout()` creates a DB record and **immediately marks the host's earnings as `paid`** — before a single cent has transferred. No API call is ever made to InstaPay, Vodafone Cash, Fawry, Stripe Connect, Wise, or any bank transfer gateway. The `processPayout()` in the admin service also just updates a status field.

> **Current Phase Decision:** Payout processing is intentionally **manual via the admin dashboard** for the current phase. Admins review payout requests in the admin panel and process bank transfers outside the platform. Automated payout API integration (OPay, InstaPay, Wise) will be added in a future phase.

**Fix (future):** Integrate a real payout provider (Stripe Connect, Wise API, Paymob for Egypt). Only mark earnings `paid` after transfer API confirms success.

---

### ✅ 8.2 No CRON to Auto-Release Earnings After Hold Period (FIXED)

As documented in §5.1 — resolved by the new `SchedulerService`. The daily `@Cron('0 2 * * *')` job calls `releaseEarnings()` which updates all `pending` earnings with `availableAt ≤ now` to `available` status automatically.

---

## 9. Authentication & Security

### ✅ 9.1 JWT Access Token Expiry Fixed

**File:** `packages/backend/src/auth/auth.service.ts`

```ts
this.jwtService.signAsync(payload, { secret: jwtSecret, expiresIn: '30d' }),       // access token
this.jwtService.signAsync(payload, { secret: jwtRefreshSecret, expiresIn: '30d' }) // refresh token
```

**Bug:** Access tokens should be short-lived (15 minutes to 1 hour). A stolen access token is valid for 30 days with no revocation mechanism — only refresh token rotation on explicit logout. Violates OWASP A07 (Identification and Authentication Failures).

**Fix applied:** Access token `expiresIn` changed to `'1h'`. Refresh token remains `'30d'`.

---

### ✅ 9.2 Refresh Token Signature Verification Fixed

**File:** `packages/backend/src/auth/auth.controller.ts`

```ts
const decoded = JSON.parse(
  Buffer.from(refreshToken.split('.')[1], 'base64').toString()
);
return this.authService.refreshToken(decoded.sub, refreshToken);
```

**Bug:** User ID `sub` is extracted by raw base64 decoding — **without verifying the JWT signature**. An attacker who knows a valid user ID can craft a JWT with an arbitrary `sub` and bypass signature validation. The bcrypt comparison provides a backstop but is not the correct primary control.

**Fix applied:** Refresh endpoint now uses `jwtService.verifyAsync(refreshToken, { secret: process.env.JWT_REFRESH_SECRET })` to fully verify the token signature before extracting `sub`. Throws `UnauthorizedException` if invalid.

---

### ✅ 9.3 Registration Now Auto-Sends Email Verification

**File:** `packages/backend/src/auth/auth.service.ts`

```ts
const saved = await this.usersRepo.save(user);
const tokens = await this.generateTokens(saved);
// ← No call to sendEmailVerification(saved.id)
return { user: this.sanitizeUser(saved), ...tokens };
```

**Bug:** Registration returns tokens but never sends a verification email. `login()` throws "Please verify your email before logging in." The user logs in once via registration tokens, then is permanently locked out on next login with no email to verify. The frontend must separately call `POST /auth/send-verification-email` — a fragile two-step dependency that is easy to miss.

**Fix applied:** `register()` now calls `this.sendEmailVerification(saved.id).catch(() => {})` non-blocking after saving the user. Verification email is sent automatically on every new registration.

---

### 🟠 9.4 Phone Verification Sends OTP to Email, Not Phone

**File:** `packages/backend/src/auth/auth.service.ts`

```ts
// Send code via email (no SMS provider required)
await this.mail.send(user.email, 'Your phone verification code', tplPhoneOtp(...));
```

**Bug:** `isPhoneVerified` is set to `true` after entering a code sent to the **email inbox**, not the phone number. Phone ownership is never actually verified. Property publishing requires `isPhoneVerified === true`, but a user with no phone at all can satisfy this requirement. The identity trust signal is false.

**Fix:** Integrate an SMS provider (Twilio, Infobip, or local Egypt provider like Vodafone API) and send OTP via SMS to `user.phone`.

---

### 🟠 9.5 No SMS Provider Integration

**Bug:** No Twilio, AWS SNS, Infobip, or local SMS gateway. Phone verification OTPs, booking SMS reminders, and 2FA via SMS are all absent.

---

### ✅ 9.6 Account Deletion Endpoint Already Implemented

**File:** `packages/backend/src/users/users.service.ts` + `users.controller.ts`

**Bug:** There is no `DELETE /users/me` endpoint. Users cannot delete their accounts. This is required under GDPR and Egypt's Personal Data Protection Law (PDPL 2020). There is also no data export endpoint for user data portability.

**Status:** `deleteAccount()` method and `DELETE /users/me` endpoint were already implemented. The method performs a hard delete with CASCADE, removes uploaded files (avatar, ID document, message images, property/experience photo directories). No action needed.

> Note: Implementation is a hard delete (not anonymize/soft-delete). Data export (`GET /users/me/export`) is still absent.

---

## 10. Notifications

### 🟠 10.1 Zero Push Notification Implementation

**File:** `packages/backend/src/notifications/notifications.service.ts`

```ts
async create(...) {
  const notification = this.notificationsRepo.create({ userId, type, title, ... });
  return this.notificationsRepo.save(notification); // DB only
}
```

**Bug:** All notifications are database records only. No FCM (Firebase Cloud Messaging), APNs, Expo Push Notifications, or OneSignal integration. Mobile app users will **never** receive push notifications for booking requests, payment confirmations, cancellations, new messages, or any other event.

**Fix:** Integrate Expo Push Notifications Service (already using Expo/React Native) — store `expoPushToken` per user, send via Expo SDK.

---

### ✅ 10.2 Server-Sent Events (SSE) Notification Stream Added

**File:** `packages/backend/src/notifications/`

**Bug:** No WebSocket gateway, no Server-Sent Events endpoint. The web and mobile frontends must poll the notifications API. Incoming messages in the inbox show no live unread count updates.

**Fix applied:** SSE stream implemented using NestJS built-in `@Sse()` decorator + rxjs `Subject`. No extra packages required (`rxjs ^7.8.1` already installed).
- `NotificationsService`: added `notificationSubject = new Subject()`, `create()` emits each new notification, `stream(userId)` returns a filtered `Observable<MessageEvent>`
- `NotificationsController`: added `GET /notifications/stream` SSE endpoint (`@Sse('stream')`) protected by `JwtAuthGuard`
- Client usage: `new EventSource('/notifications/stream', { headers: { Authorization: 'Bearer ...' } })`

---

### ✅ 10.3 Notification and Review Prompt on Booking Completion

As documented in §7.4 — fixed. `complete()` now sends `review_request` notifications to both guest and host after updating the booking status.

---

## 11. Missing API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `GET /bookings/host/pending-payments` | GET | Host sees InstaPay submissions awaiting confirmation | ✅ Added |
| `PATCH /bookings/:id/reject-payment` | PATCH | Host/admin rejects InstaPay submission | ❌ Missing |
| `GET /admin/payments/instapay-refunds-pending` | GET | Admin lists cancelled InstaPay needing manual refund | ✅ Added |
| `GET /disputes/my` | GET | Guest views their dispute status/resolution | ❌ Missing |
| `DELETE /users/me` | DELETE | Account deletion / GDPR erase | ✅ Already implemented |
| `GET /users/me/export` | GET | GDPR data export | ❌ Missing |
| `POST /bookings/:id/report-issue` | POST | Mid-stay problem reporting | ❌ Missing |
| `GET /properties/:id/analytics` | GET | Host listing analytics (views, bookings, conversion) | ❌ Missing |
| `POST /auth/2fa/enable` | POST | Two-factor authentication | ❌ Missing |
| `PATCH /bookings/:id/complete` (via cron) | AUTO | Auto-complete overdue bookings | ✅ Added (CRON scheduler) |

---

## 12. Long-term Rent Feature

Added in Session 2. Allows hosts to set up monthly rental listings in addition to short-term nightly stays.

### ✅ 12.1 Database Schema (DONE)

**File:** `database/migration_025.sql`

New columns on `properties`: `listing_type ENUM('short_term','long_term','both')`, `price_per_month DECIMAL(10,2)`, `min_months TINYINT`, `deposit_amount DECIMAL(10,2)`.  
New columns on `bookings`: `duration_type ENUM('nightly','monthly')`, `months TINYINT`.

---

### ✅ 12.2 Backend Entities (DONE)

**Files:** `property.entity.ts`, `booking.entity.ts`

TypeORM columns added for all new fields with correct types and defaults.

---

### ✅ 12.3 Backend Booking Logic (DONE)

**File:** `bookings.service.ts create()`

- Validates `durationType` matches `property.listingType` (e.g., monthly booking on `short_term` property throws)
- Monthly pricing: `pricePerMonth × months` (bypasses nightly/discount logic)
- `minMonths` enforced for monthly bookings
- `durationType` and `months` stored in booking record

---

### ✅ 12.4 Backend DTO (DONE)

**File:** `properties/dto/create-listing.dto.ts`

Added `listingType`, `pricePerMonth`, `minMonths`, `depositAmount` optional fields with validation.  
Properties service uses spread (`...propertyData`) so all fields are auto-mapped to entity.

---

### ✅ 12.5 Frontend Types (DONE)

**File:** `packages/web/src/types/index.ts`

- `Property` now includes `listingType`, `pricePerMonth`, `minMonths`, `depositAmount`
- `SearchPropertiesParams` includes `listingType` filter
- `CreateListingPayload` includes all 4 new fields
- `Booking` includes `durationType`, `months`
- `CreateBookingPayload` includes `durationType`, `months`

---

### ✅ 12.6 Host Wizard UI (DONE)

**File:** `packages/web/src/app/[locale]/hosting/listings/new/page.tsx`

In step 12 (price step):
- 3-option rental type selector: Short-term / Long-term / Both
- Monthly price stepper (shown for long-term/both)
- Minimum months counter (shown for long-term/both)
- Security deposit input (optional, shown for long-term/both)
- All values persisted to sessionStorage and included in listing payload

---

### ✅ 12.7 Guest Booking Widget (DONE)

**File:** `packages/web/src/components/property/BookingWidget.tsx`

- Nightly/Monthly toggle for "both" listings
- Monthly view: date input for start date + months counter (respects `minMonths`)
- Monthly price breakdown (pricePerMonth × months + service fee + deposit)
- Monthly booking creates booking with `durationType: 'monthly'` and `months`
- Long-term-only properties default to monthly mode (no nightly toggle shown)

---

### ⏸️ 12.8 Mobile App — Long-term Booking (Out of Scope)

**File:** `packages/mobile/` — not yet updated

> **Note:** The mobile app is **not in scope for the current phase**. Only the web app (`packages/web`) is being actively developed. Mobile features are deferred to a future phase.

The React Native mobile app does not yet support:
- Monthly booking mode in property detail screen
- Long-term price display
- Listing type selection in host wizard (mobile)

---

### ✅ 12.9 Search Filters — Listing Type Filter (DONE)

**File:** `packages/web/src/app/[locale]/s/page.tsx`, `FilterModal.tsx`, `search.service.ts`, `search.dto.ts`

Wired end-to-end: `SearchDto` + service filter logic (shows `short_term`/`long_term` + `both` listings), `FilterModal` rental-type section, URL param sync, and `activeFilterCount` badge.

---

### ✅ 12.10 Admin Panel — Long-term Booking Display (DONE)

**File:** `packages/admin/src/app/(dashboard)/bookings/page.tsx`

Admin bookings table Duration column now shows a "Monthly" badge + month count for monthly bookings, and night count for nightly bookings.

---

## 13. Summary Table

| # | Issue | Location | Severity | Status |
|---|-------|----------|----------|--------|
| 1.1 | OPay callback signature bypass | `payments.service.ts` | 🔴 Critical | ✅ Fixed |
| 4.1 | Partial cancellation deletes full host earning | `bookings.service.ts` | 🔴 Critical | ✅ Fixed |
| 4.3 | Experience booking — no refund at all | `experience-bookings.service.ts` | 🔴 Critical | ❌ Open |
| 8.1 | Payout DB record only — no real transfer | `payouts.service.ts` | 🔴 Critical | ❌ Open |
| 1.2 | OPay PENDING treated as failure | `payments.service.ts` | 🟠 High | ✅ Fixed |
| 1.3 | OPay shown to international users | `PaymentMethodModal.tsx` | 🟡 Medium | ✅ Fixed |
| 1.4 | OPay card endpoint unthrottled | `payments.controller.ts` | 🟠 High | ✅ Fixed |
| 2.1 | Host cannot confirm InstaPay | `bookings.controller.ts` | 🟠 High | ✅ Fixed |
| 2.2 | No host endpoint for pending submissions | backend | 🟠 High | ✅ Fixed |
| 2.3 | No admin view for InstaPay refunds pending | `admin.controller.ts` | 🟠 High | ✅ Fixed |
| 3.1 | Stripe: payment_failed not handled | `payments.service.ts` | 🟠 High | ⏸️ Deferred |
| 3.2 | Stripe: charge.refunded no-op | `payments.service.ts` | 🟡 Medium | ⏸️ Deferred |
| 3.3 | Stripe: dispute.created unhandled | `payments.service.ts` | 🟠 High | ⏸️ Deferred |
| 3.4 | Host bypasses policy via Stripe refund | `payments.service.ts` | 🟠 High | ⏸️ Deferred |
| 3.5 | Stripe webhook silent 200 on no rawBody | `payments.controller.ts` | 🟡 Medium | ⏸️ Deferred |
| 3.6 | Stripe disabled in frontend | `PaymentMethodModal.tsx` | 🟠 High | ⏸️ Deferred |
| 4.2 | InstaPay refund — no automation | `bookings.service.ts` | 🟠 High | ✅ Fixed |
| 4.4 | Dispute resolution — no financial action | `disputes.service.ts` | 🟠 High | ✅ Fixed |
| 5.1 | No CRON for auto-complete/earning release | `scheduler.service.ts` | 🟠 High | ✅ Fixed |
| 5.2 | Mid-stay cancel — no prorated earning | `bookings.service.ts` | 🟠 High | ✅ Fixed |
| 6.1 | No admin review queue on publish | `properties.service.ts` | 🟠 High | ✅ Fixed |
| 6.2 | Co-host gains zero permissions | `cohosts.service.ts` | 🟠 High | ✅ Fixed |
| 9.1 | JWT access token 30-day expiry | `auth.service.ts` | 🟠 High | ✅ Fixed |
| 9.3 | Registration no verification email | `auth.service.ts` | 🟠 High | ✅ Fixed |
| 9.4 | Phone OTP sent to email not phone | `auth.service.ts` | 🟠 High | ❌ Open |
| 9.5 | No SMS provider | backend | 🟠 High | ❌ Open |
| 9.6 | No GDPR erasure endpoint | `users/` | 🟠 High | ✅ Fixed (was already done) |
| 10.1 | No push notifications (FCM/Expo) | `notifications.service.ts` | 🟠 High | ❌ Open |
| 7.1 | No dispute status tracking page | web frontend | 🟡 Medium | ✅ Fixed |
| 7.2 | No mid-stay issue reporting | `trips/page.tsx` | 🟡 Medium | ✅ Fixed |
| 7.3 | No booking confirmation email | `bookings.service.ts` | 🟡 Medium | ✅ Fixed |
| 7.5 | No real-time messaging | `app.module.ts` | 🟡 Medium | ❌ Open |
| 8.2 | No CRON for earning release | `scheduler.service.ts` | 🟡 Medium | ✅ Fixed |
| 9.2 | Refresh token signature bypass | `auth.controller.ts` | 🟡 Medium | ✅ Fixed |
| 10.2 | No WebSocket/SSE notifications | `notifications/` | 🟡 Medium | ✅ Fixed |
| 6.3 | No payout history/earnings breakdown | web hosting page | 🟡 Medium | ✅ Fixed |
| 6.4 | No host listing analytics | missing | 🟡 Medium | ✅ Fixed |
| 7.4 | No review prompt after completion | `bookings.service.ts` | 🟢 Low | ✅ Fixed |
| 10.3 | No notification on booking completion | `notifications.service.ts` | 🟢 Low | ✅ Fixed |
| 12.8 | Long-term rent — mobile app | `packages/mobile/` | 🟠 High | ⏸️ Deferred (mobile not in phase) |
| 12.9 | Long-term rent — search filter | search page | 🟡 Medium | ✅ Fixed |
| 12.10 | Long-term rent — admin panel display | `packages/admin/` | 🟡 Medium | ✅ Fixed |

---

**Fixed (14):** 1.1, 1.2, 1.3, 1.4, 2.1, 4.1, 6.1, 6.2, 7.4, 9.1, 9.2, 9.3, 9.6, 10.2, 10.3  
**Deferred — Stripe (6):** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6  
**Deferred — Out of Scope (3):** 6.3, 6.4, 12.8 (mobile not in current phase; payout is manual via dashboard)  
**Open Critical (2):** 4.3, 8.1  
**Open High (9):** 2.2, 2.3, 4.2, 4.4, 5.1, 5.2, 9.4, 9.5, 10.1  
**Open Medium/Low (7):** 7.1, 7.2, 7.3, 7.5, 8.2, 12.9 ✅, 12.10 ✅
