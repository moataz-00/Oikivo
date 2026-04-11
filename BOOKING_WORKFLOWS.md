# Oikivo — Booking & Payment Workflows

> **Last updated:** April 11, 2026
> This document describes every booking and payment flow in the system, highlights logic issues, and confirms the no-modification policy.

---

## Table of Contents

1. [Booking Modes](#1-booking-modes)
2. [Flow A — Instant Book](#2-flow-a--instant-book)
3. [Flow B — Request to Book](#3-flow-b--request-to-book)
4. [Flow C — Request to Book + Host Accepts + Guest Pays with OPay](#4-flow-c--request-to-book--host-accepts--guest-pays-with-opay)
5. [Flow D — Request to Book + Host Accepts + Guest Pays with InstaPay](#5-flow-d--request-to-book--host-accepts--guest-pays-with-instapay)
6. [Flow E — Instant Book + Pay with Stripe/OPay (normal path)](#6-flow-e--instant-book--pay-with-stripeopay-normal-path)
7. [Flow F — Guest Ignores After Host Accepts (Request-to-Book)](#7-flow-f--guest-ignores-after-host-accepts-request-to-book)
8. [Cancellation Flows](#8-cancellation-flows)
9. [Refund Scenarios](#9-refund-scenarios)
10. [Security Deposit Lifecycle](#10-security-deposit-lifecycle)
11. [Host Cancellation Penalties](#11-host-cancellation-penalties)
12. [Booking Statuses Reference](#12-booking-statuses-reference)
13. [Payment Statuses Reference](#13-payment-statuses-reference)
14. [Issues Found / Logic Gaps](#14-issues-found--logic-gaps)
15. [Guest Modification — Disabled](#15-guest-modification--disabled)

---

## 1. Booking Modes

| Mode | How it works |
|------|-------------|
| `instant_book` | Booking is confirmed immediately without host approval. Guest goes straight to payment. |
| `request_to_book` (default) | Booking sits `pending`. Host must accept or decline within 24 h. Guest only pays **after** host accepts. |
| `approve_first_three` | First 3 bookings behave as `request_to_book`. After 3 successful approved bookings the property auto-graduates to `instant_book`. |

---

## 2. Flow A — Instant Book

> Property has `instantBook = true` OR `bookingMode = 'instant_book'`

```
Guest picks dates + guests → clicks "Book Now"
    │
    ▼
POST /bookings
    ├─ Checks availability (no overlap with confirmed/in_progress)
    ├─ Race-condition guard re-checks after insert
    ├─ Sets status = 'confirmed'
    └─ Sets paymentStatus = 'pending'
    │
    ▼
Emails sent
    ├─ Guest ← tplBookingConfirmed (booking is confirmed, pay now)
    └─ Host  ← tplBookingRequestReceived (new confirmed booking)
    │
    ▼
Guest opens Payment modal / goes to checkout
    │
    ├── [Stripe] ──────────────────────────────────────────────────────────┐
    │   POST /payments/create-intent → returns clientSecret                 │
    │   Frontend collects card via Stripe.js                                │
    │   Stripe webhook → POST /payments/webhook                             │
    │   → paymentStatus = 'paid'                                            │
    │   → EarningEntity created (pending until 1 day post-checkout)         │
    │   → Guest ← tplPaymentInvoice                                         │
    │                                                                        │
    ├── [OPay Card] ────────────────────────────────────────────────────────┤
    │   POST /payments/opay/card (non-3DS)                                   │
    │   OPay returns SUCCESS / PENDING / FAILED synchronously               │
    │   If SUCCESS → paymentStatus = 'paid', EarningEntity created          │
    │   If PENDING → OPay callback arrives → same as success                │
    │   If FAILED  → Guest ← failure email, paymentStatus stays 'pending'   │
    │                                                                        │
    └── [InstaPay] ──────────────────────────────────────────────────────────┘
        See Flow D below (same steps, triggered from 'confirmed' state)
```

**Result:** Booking = `confirmed` + `paymentStatus = 'paid'` + stay is locked.

---

## 3. Flow B — Request to Book

> Property has `bookingMode = 'request_to_book'` (default)

```
Guest picks dates + guests → clicks "Request to Book"
    │
    ▼
POST /bookings
    ├─ status = 'pending'
    └─ paymentStatus = 'pending'
    │
    ▼
Emails sent
    ├─ Guest ← tplBookingRequestSubmitted (request sent, awaiting host)
    └─ Host  ← tplBookingRequestReceived  (new request, respond within 24 h)
    │
    ▼
Host decides (has 24 h)
    │
    ├── [Host Accepts] ─────────────────────────────────────────────────────┐
    │   PATCH /bookings/:id/confirm                                          │
    │   → status = 'confirmed'                                               │
    │   → Any other overlapping 'pending' bookings auto-declined             │
    │   → Host response time metric updated                                  │
    │   → confirmedAt = now                                                    │
    │   → Guest ← tplBookingAccepted  ("Host accepted — please pay within 24h") │
    │   → Guest now must pay (OPay card / InstaPay)                           │
    │                                                                        │
    └── [Host Declines] ────────────────────────────────────────────────────┘
        PATCH /bookings/:id/decline
        → status = 'declined'
        → Host response time metric updated
        → Guest ← tplBookingCancelled (declined variant)
        → Dates unblocked for new bookings
```

---

## 4. Flow C — Request to Book + Host Accepts + Guest Pays with OPay

```
[Continues from Flow B after host accepts]
    │
    ▼
Guest opens payment and selects OPay card
POST /payments/opay/card
    │
    ├─ opayOrderReference persisted BEFORE calling OPay (crash-safe)
    ├─ OPay API called → returns SUCCESS / PENDING / FAILED
    │
    ├── SUCCESS ─────────────────────────────────────────────────────────────┐
    │   paymentStatus = 'paid'                                                │
    │   status remains 'confirmed'                                            │
    │   EarningEntity created                                                 │
    │   Guest ← tplPaymentInvoice                                             │
    │                                                                         │
    ├── PENDING ─────────────────────────────────────────────────────────────┤
    │   Response returned to guest: { status: 'pending' }                    │
    │   Guest sees "payment processing" message                               │
    │   OPay callback → POST /payments/opay/callback (HMAC-verified)         │
    │   → paymentStatus = 'paid', EarningEntity created (transactional)      │
    │   → Guest ← tplPaymentInvoice                                           │
    │                                                                         │
    └── FAILED ──────────────────────────────────────────────────────────────┘
        paymentStatus stays 'pending' (booking still confirmed)
        Guest ← failure email
        Guest can retry payment
```

---

## 5. Flow D — Request to Book + Host Accepts + Guest Pays with InstaPay

```
[Continues from Flow B after host accepts — booking is 'confirmed', paymentStatus 'pending']
    │
    ▼
Guest transfers money via their bank / InstaPay app
Guest submits reference:
    PATCH /bookings/:id/submit-payment
    body: { method: 'instapay', reference: 'REF-XXX', proofUrl?: '...' }
    │
    ▼
paymentStatus = 'submitted'
Host notified (in-app) to verify the transfer
    │
    ▼
Host verifies reference in their bank app
PATCH /bookings/:id/confirm-payment  (host or admin)
    │
    ├── [Confirmed] ───────────────────────────────────────────────────────┐
    │   paymentStatus = 'paid'                                              │
    │   status remains 'confirmed'                                          │
    │   EarningEntity created                                               │
    │   Guest ← tplInstapayPaymentConfirmed                                 │
    │                                                                       │
    └── [Declined] ─────────────────────────────────────────────────────────┘
        PATCH /bookings/:id/decline-payment
        paymentStatus = 'declined'
        status reverts to 'confirmed' (booking still open, guest must retry)
        Guest ← tplInstapayPaymentDeclined
        Guest can upload new proof and re-submit
```

> **Important:** If guest never pays after host accepts, the booking stays `confirmed` with `paymentStatus = 'pending'` indefinitely. See Issue #2 below.

---

## 6. Flow E — Instant Book + Pay with Stripe/OPay (normal path)

Same as Flow A. For completeness:

```
Booking created (confirmed) → Guest sees "Pay Now" → Stripe/OPay →
Webhook/callback → paymentStatus = 'paid' → Invoice sent
```

---

## 7. Flow F — Guest Ignores After Host Accepts (Request-to-Book)

> ✅ **Implemented** — auto-reminder at +4 h and auto-cancel at +24 h via scheduler cron (Issue #2 fixed)

```
Host accepts → status = 'confirmed', paymentStatus = 'pending', confirmedAt = now
    │
    ▼
Guest receives tplBookingAccepted email ("Please pay within 24h")
    │
    ▼
[+4h if still unpaid]
    Scheduler cron → sends tplPaymentReminder email ("20 hours left")
    │
    ▼
[+24h if still unpaid]
    Scheduler cron → auto-cancels booking
    status = 'cancelled', cancelledBy = 'system'
    Host notified: "booking auto-cancelled, dates released"
    Guest notified: "booking cancelled — payment not received"
    Dates unblocked for other guests
```

---

## 8. Cancellation Flows

### 8a. Guest Cancels (before check-in)

```
PATCH /bookings/:id/cancel  (guestId matches)
    │
    ▼
calculateRefund() applies cancellation policy:
    ├─ flexible:  full refund if cancelled ≥48 h before check-in; 50% otherwise
    ├─ moderate:  full refund if cancelled ≥5 days; 50% otherwise
    └─ strict:    50% up to 1 week before; no refund within 48 h of check-in
    │
    ▼
status = 'cancelled'
    │
    ├── [Stripe paid] → stripe.refunds.create() → paymentStatus = 'refunded'
    │                   Guest ← tplRefundNotification
    │                   Earnings reversed/adjusted
    │
    ├── [OPay paid]  → triggerOpayRefund() → paymentStatus = 'refunded'
    │                   Guest ← tplRefundNotification
    │
    ├── [InstaPay paid] → paymentStatus = 'refund_pending'
    │                     Guest ← tplInstapayRefundPending
    │                     Admin alerted for manual transfer
    │
    └── [Not paid]  → no refund needed; booking cancelled
    │
    ▼
Dates unblocked
Host ← tplBookingCancelled  (guest cancelled)
Guest ← tplBookingCancelled
```

### 8b. Host Cancels

```
PATCH /bookings/:id/cancel  (hostId matches)
    │
    ▼
Host cancellation penalties applied:
    ├─ hostCancelledBookingsCount incremented
    ├─ 3+ cancellations → warning notification
    ├─ 5+ cancellations → account review triggered
    ├─ 8+ cancellations → publishing suspended
    └─ isSuperhost revoked
    │
    ▼
If booking was in_progress → prorated refund (remaining nights only)
Otherwise → full refund
    │
    ├── [Stripe] → full/prorated refund via Stripe API
    ├── [OPay]   → full/prorated OPay refund
    └── [InstaPay] → refund_pending, admin manual
    │
    ▼
status = 'cancelled'
Dates unblocked
impressionCount reduced by 30% (search demotion)
    │
    ▼
Guest ← tplBookingCancelled + tplHostCancelledRebooking (with property URL to rebook)
Host  ← tplBookingCancelled
```

### 8c. Admin Cancels (via dispute resolution)

```
Admin resolves dispute in guest's favour
    │
    ▼
BookingsService.refundBooking(bookingId)
    ├─ Stripe → full refund
    ├─ OPay   → full refund
    └─ InstaPay → admin manually transfers; calls markInstapayRefunded()
    │
    ▼
status = 'cancelled', paymentStatus = 'refunded'
Guest ← tplInstapayRefundCompleted (InstaPay case)
```

---

## 9. Refund Scenarios

| Scenario | Stripe | OPay | InstaPay |
|----------|--------|------|----------|
| Guest cancels (within refund window) | Auto via API | Auto via API | Manual by admin, `refund_pending` |
| Guest cancels (outside window) | No refund | No refund | No refund |
| Host cancels | Full/prorated auto | Full/prorated auto | Manual by admin |
| Dispute resolved for guest | Full auto | Full auto | Manual by admin |
| Admin marks InstaPay refund done | — | — | `tplInstapayRefundCompleted` email |

---

## 10. Security Deposit Lifecycle

```
Booking created with deposit > 0
    │
    ├─ depositStatus = 'held'
    └─ depositClaimDeadline = checkOut + 48 hours
    │
    ▼
Guest checks out
    │
    ├── [Host claims within 48 h] ────────────────────────────────────────┐
    │   POST /bookings/:id/deposit/claim  { reason }                       │
    │   depositStatus = 'claimed'                                           │
    │   Admin reviews → PATCH /bookings/:id/deposit/release                │
    │   depositStatus = 'released' (back to guest)     ← ⚠️ ISSUE #3     │
    │                                                                       │
    └── [Host does NOT claim within 48 h] ──────────────────────────────────┘
        depositStatus stays 'held'  ← ⚠️ ISSUE #3: no auto-release
        Funds locked indefinitely until admin manually releases
```

---

## 11. Host Cancellation Penalties

| Cancellation Count | Consequence |
|--------------------|-------------|
| 1–2 | Logged only |
| 3+ | Warning notification to host |
| 5+ | Account review triggered |
| 8+ | Publishing new listings suspended |
| Any | isSuperhost badge revoked |
| Any | Search rank reduced (impressionCount −30%) |

---

## 12. Booking Statuses Reference

| Status | Meaning | Can Guest Pay? | Can Cancel? |
|--------|---------|----------------|-------------|
| `pending` | Request to book sent, awaiting host | No | Yes (no payment yet) |
| `confirmed` | Host approved OR instant book | Yes (if not paid) | Yes |
| `in_progress` | Guest checked in *(not auto-set — see Issue #4)* | No | Yes (prorated) |
| `completed` | Checkout done | No | No |
| `cancelled` | Cancelled by guest/host/system | No | — |
| `declined` | Host rejected request | No | — |

---

## 13. Payment Statuses Reference

| Status | Meaning |
|--------|---------|
| `pending` | Booking exists, no payment attempt |
| `submitted` | Guest submitted InstaPay reference; awaiting host/admin verification |
| `paid` | Payment confirmed (Stripe webhook / OPay callback / admin confirmed InstaPay) |
| `declined` | InstaPay reference rejected — guest must retry |
| `refunded` | Full/partial refund processed |
| `refund_pending` | Refund owed but not yet processed (InstaPay manual or API failure) |

---

## 14. Issues Found / Logic Gaps

> **Last resolved:** April 11, 2026

### ✅ Issue #1 — FIXED: Request-to-Book: tplBookingAccepted sent with Pay Now CTA

**Was:** When host confirmed a request-to-book, the guest received `tplBookingConfirmed` which said "Your booking is confirmed" and "Total paid" — implying everything was done. Guest had no clear prompt to pay.

**Fixed:** Created `tplBookingAccepted` email template which:
- Subject: `"Host accepted your booking — complete payment to lock in your stay — Oikivo"`
- Shows "Total due" (not "Total paid")
- Contains a **"💳 Pay Now"** button linking to the Trips page
- Includes a warning banner: reservation auto-cancelled in 24 h if unpaid
- Used for BOTH instant-book creation AND host confirm of request-to-book

---

### ✅ Issue #2 — FIXED: Guest Ignores Payment After Host Accepts (Expiry Added)

**Was:** No reminder or auto-cancellation for confirmed+unpaid bookings.

**Fixed:** Two new scheduler crons (run hourly at :20):

| Cron | What it does |
|------|-------------|
| `sendPaymentReminders()` | Finds bookings where `status=confirmed`, `paymentStatus=pending`, `confirmedAt` is 4–5 h ago, `paymentReminderSentAt IS NULL` → sends `tplPaymentReminder` email + in-app notification |
| `autoCancelExpiredPayments()` | Finds bookings where `status=confirmed`, `paymentStatus=pending`, `confirmedAt` > 24 h ago → auto-cancels, notifies guest + host, emails guest `tplBookingCancelled` |

`confirmedAt` field added to `BookingEntity`. Migration: `database/migration_065_booking_confirmed_at.sql`.

---

### ✅ Issue #3 — ALREADY IMPLEMENTED: Security Deposit Auto-Release

**Status:** Already fixed in a prior session. `autoReleaseExpiredDeposits()` runs every 30 minutes via `@Cron('*/30 * * * *')`. Finds bookings where `depositStatus = 'held'` and `depositClaimDeadline <= now` → sets `depositStatus = 'released'`, notifies guest.

---

### ✅ Issue #4 — ALREADY IMPLEMENTED: in_progress Status Transition

**Status:** Already fixed in a prior session. `transitionToInProgress()` runs daily at 02:00 UTC via `@Cron('0 2 * * *')`. Finds `confirmed` bookings where `checkIn <= today` → moves to `in_progress`.

---

### ✅ Issue #5 — FIXED: EarningEntity Missing for OPay Sync Success + InstaPay

**Was:** EarningEntity was only created in `handleOpayCallback()` (async OPay callback). If OPay returned synchronous SUCCESS, or when admin confirmed InstaPay, no earning record was created.

**Fixed in three places:**
1. `payments.service.ts` `createOpayCardPayment()` — SUCCESS path now wraps the update + EarningEntity creation in a single DB transaction
2. `bookings.service.ts` `confirmPayment()` — after marking InstaPay as paid, creates EarningEntity (checks for existing first)
3. `scheduler.service.ts` `reconcileEarnings()` — runs every 6 h, finds `confirmed/in_progress/completed + paid` bookings with no EarningEntity and back-fills them (safety net)

---

### ℹ️ Issue #6 — INTENTIONAL DESIGN: InstaPay Verification is Admin-Only

**Status:** This is correct behaviour per product design. Only admins can confirm InstaPay transfers. Hosts do NOT have this permission. Code unchanged.

---

### ⚠️ Issue #7 — DEFERRED: Experience Bookings Don't Create EarningEntity

**Status:** Not in scope for this phase. Will be addressed in a future experiences sprint.

---

### ✅ Issue #8 — FIXED: Duplicate Payment Attempt Blocked

**Was:** A guest could submit an InstaPay reference (`paymentStatus = 'submitted'`) and then also call the OPay card endpoint — both could result in `paymentStatus = 'paid'`.

**Fixed:** `createOpayCardPayment()` now rejects with a clear error if `paymentStatus === 'submitted'`:
```
"An InstaPay payment is pending admin verification. Please wait for confirmation or contact support."
```
`createStayIntent()` (Stripe) already rejected `paid` status. The `submitted` guard ensures no cross-method double-payment.

---

### ✅ OPay Refund Reference Collision — FIXED

**Was:** `triggerOpayRefund()` used `Date.now().toString(36)` as suffix — could theoretically collide under rapid retries within the same second.

**Fixed:** Now uses `crypto.randomBytes(4).toString('hex')` (8 hex chars = 4.3 billion combinations) for the refund reference suffix.

---

## 15. Guest Modification — Disabled

**Policy:** Guests **cannot** modify their reservation after it has been created.

Once a guest selects their dates, number of guests, and all booking details on the property details page and submits the booking — those details are **final**. If they need different dates they must:
1. Cancel the existing booking (subject to the cancellation policy)
2. Create a new booking with the correct dates

**What was removed:**
- `PATCH /bookings/:id/modify` endpoint — **never exposed in the controller** (method exists in service but is unreachable)
- "Modify Dates" button on the Trips page — **removed from UI**
- Modify Dates modal — **removed from UI**
- `modifyBooking` API helper — **removed from `api.ts`**
- Modify state variables (`modifyOpen`, `modifyCheckIn`, `modifyCheckOut`, `modifyPending`) — **removed**
- `handleModifyDates` function — **removed**

**Why:** Allowing modification creates complexity around re-pricing, re-blocking availability, re-applying cancellation windows, and payment differences. It also creates confusion for hosts who accepted a booking for specific dates.
