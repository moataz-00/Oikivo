# Phase 1 Feature Audit
> Scope: Guest-side property flow · Host-side property flow · OPay card payment · OPay refund · InstaPay workflow
>
> Status key: ✅ Implemented · ⚠️ Partial / Needs Verification · ❌ Missing / Broken

---

## 1. Guest-Side Property Flow

### 1.1 Search & Discovery (`/s`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| G1 | Full-text + location search | ✅ | `GET /search/properties` with `q`, `city` params |
| G2 | Date-range filter (`checkIn` / `checkOut`) | ✅ | Passed to search, blocks unavailable listings |
| G3 | Guest-count filter (`guests`) | ✅ | Checked against `maxGuests` |
| G4 | Price range filter (`minPrice` / `maxPrice`) | ✅ | |
| G5 | Space-type filter (`spaceType`) | ✅ | |
| G6 | Beds / Bathrooms filter | ✅ | |
| G7 | Amenities multi-select filter | ✅ | |
| G8 | Instant-book filter | ✅ | |
| G9 | Pets-allowed filter | ✅ | |
| G10 | Category filter | ✅ | |
| G11 | Radius / geo-bounding filter (`lat`, `lng`, `radius`) | ✅ | |
| G12 | Sorting (`sort` param) | ✅ | |
| G13 | Map view alongside results | ✅ | `MapView` component with markers |
| G14 | Pagination / infinite scroll | ✅ | `page` + `limit` state in `s/page.tsx` passed to `searchProperties()` → backend `skip/take`; pagination controls rendered when `totalPages > 1` |
| G15 | Filter modal on mobile | ✅ | `FilterModal.tsx` |
| G16 | No long-term filter UI (rent-type / move-in date / min months) | ✅ | Removed from `FilterModal` and i18n keys |

### 1.2 Property Detail Page (`/rooms/[id]`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| G17 | Photo gallery / lightbox | ✅ | |
| G18 | Property title, description, type, space | ✅ | |
| G19 | Amenities list | ✅ | |
| G20 | House rules display | ✅ | |
| G21 | Cancellation policy display | ✅ | Nightly policy only |
| G22 | Host profile card + contact button | ✅ | |
| G23 | Star rating + review list | ✅ | |
| G24 | Availability calendar | ✅ | Blocked dates shown, sourced from `GET /availability/:propertyId` |
| G25 | Map embed showing property location | ✅ | |
| G26 | Share listing | ✅ | |
| G27 | Save to wishlist | ✅ | `POST /wishlists` |
| G28 | Nightly price displayed (no monthly price) | ✅ | LT price displays removed |

### 1.3 BookingWidget (`components/property/BookingWidget.tsx`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| G29 | Date range picker | ✅ | |
| G30 | Guest count (adults + children) | ✅ | |
| G31 | Real-time price preview (nightly × nights + fees) | ✅ | Queries `GET /properties/:id/price-preview` |
| G32 | Weekly / monthly ST discount applied in preview | ✅ | |
| G33 | Min-nights validation | ✅ | Shows error if below minNights |
| G34 | "Reserve" creates booking → triggers `PaymentMethodModal` | ✅ | `pendingBookingId` state passed to modal |
| G35 | Unavailable dates blocked in picker | ✅ | |
| G36 | Loading / error states | ✅ | |

### 1.4 Payment Method Selection (`PaymentMethodModal.tsx`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| G37 | Egypt timezone detection → shows InstaPay + OPay options | ✅ | `Intl.DateTimeFormat().resolvedOptions().timeZone === 'Africa/Cairo'` |
| G38 | Non-Egypt → shows Stripe only | ✅ | |
| G39 | Method selection routes to correct sub-modal | ✅ | Stripe → `StripeCheckoutModal`, OPay → `OPayCardModal`, InstaPay → `InstapayModal` |

### 1.5 Trips / Booking History (`/trips`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| G40 | List of upcoming and past bookings | ✅ | |
| G41 | Booking status shown (pending, confirmed, cancelled, etc.) | ✅ | |
| G42 | Payment status shown (pending, submitted, paid, refunded, declined) | ✅ | |
| G43 | Cancel booking action | ✅ | |
| G44 | "Payment submitted" state shown after InstaPay submission | ✅ | |
| G45 | Refund status visible after cancellation | ✅ | |

---

## 2. Host-Side Property Flow

### 2.1 Listing Creation Wizard (`/hosting/listings/new`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| H1 | 16-step wizard, no long-term steps | ✅ | `TOTAL_STEPS = 16`, `rental-type` step removed |
| H2 | Step 1 — Property kind (entire/private/shared) | ✅ | |
| H3 | Step 2 — Space type | ✅ | |
| H4 | Step 3 — Location (address + map pin) | ✅ | |
| H5 | Step 4 — Floor-plan (beds, baths, max guests, min nights only) | ✅ | LT `minMonths` + `moveInNotice` removed |
| H6 | Step 5 — Stand-out / category | ✅ | |
| H7 | Step 6 — Amenities selection | ✅ | |
| H8 | Step 7 — Photos upload (min 5) | ✅ | |
| H9 | Step 8 — Title | ✅ | |
| H10 | Step 9 — Description | ✅ | |
| H11 | Step 10 — House rules + cancellation policy (ST policies only) | ✅ | LT "monthly lease" option removed |
| H12 | Step 11 — Instant book toggle | ✅ | |
| H13 | Step 12 — Nightly price | ✅ | LT monthly pricing block removed |
| H14 | Step 13 — Weekend price | ✅ | |
| H15 | Step 14 — Weekly / monthly ST discounts | ✅ | LT tier-discount block removed |
| H16 | Step 15 — Legal (terms acceptance) | ✅ | |
| H17 | Step 16 — Review & submit (KYC check) | ✅ | All `handleStepClick` refs updated, nightly price only |
| H18 | `isNextDisabled()` uses correct step numbers post-rename | ✅ | Verified all step refs decremented |
| H19 | `buildListingPayload` contains no LT fields | ✅ | |
| H20 | Progress bar reflects 16 steps | ✅ | |

### 2.2 Listing Management
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| H21 | Edit listing (`/hosting/listings/[id]/edit`) | ✅ | |
| H22 | Manage availability / calendar (`/hosting/listings/[id]/calendar`) | ✅ | Block dates, set min nights per date range |
| H23 | Cohost management (`/hosting/listings/[id]/cohosts`) | ✅ | Add/remove cohosts |
| H24 | Listing status toggle (active / inactive) | ✅ | |

### 2.3 Reservations & Earnings
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| H25 | Reservations page — incoming bookings list | ✅ | |
| H26 | Confirm / decline booking actions | ✅ | |
| H27 | Host pending-payments queue for InstaPay | ✅ | `GET /bookings/host/pending-payments` |
| H28 | Earnings page (`/hosting/earnings`) | ✅ | |
| H29 | Payout request (instapay, bank_transfer, cash) | ✅ | `POST /payouts/request` |
| H30 | Payout history | ✅ | `GET /payouts/history` |
| H31 | Analytics page (performance metrics) | ✅ | |
| H32 | Inbox / messages | ✅ | |

---

## 3. OPay Card Payment Flow

### 3.1 Frontend (`OPayCardModal.tsx`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| O1 | Card number input with auto-formatting (groups of 4) | ✅ | |
| O2 | Expiry (MM/YY) and CVV inputs | ✅ | |
| O3 | Cardholder name input | ✅ | |
| O4 | Client-side validation before submit | ✅ | |
| O5 | Loading / processing state shown during API call | ✅ | |
| O6 | Success state with booking confirmation | ✅ | |
| O7 | Failure state with error message and retry option | ✅ | |
| O8 | `onSuccess('opay-card')` callback fires on success | ✅ | |

### 3.2 Backend (`POST /payments/opay/card`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| O9 | Route requires JWT auth | ✅ | `@UseGuards(JwtAuthGuard)` |
| O10 | Rate-limited to 5 requests/min per user | ✅ | `@Throttle({ default: { ttl: 60000, limit: 5 } })` |
| O11 | Supports `bookingType: 'stay' \| 'experience'` | ✅ | |
| O12 | OPay sandbox vs production routing via `OPAY_ENV` env var | ✅ | |
| O13 | Card data sent to OPay API over HTTPS | ✅ | `https` native module used |
| O14 | `opay_order_reference` saved to booking record | ✅ | |
| O15 | `payment_status` set to `'paid'` on success | ✅ | |
| O16 | `payment_method` set to `'opay-card'` | ✅ | |
| O17 | Booking confirmation email sent on success | ✅ | `tplBookingConfirmed` |
| O18 | Payment invoice email sent on success | ✅ | `tplPaymentInvoice` |

### 3.3 Required Environment Variables
| Variable | Description |
|----------|-------------|
| `OPAY_MERCHANT_ID` | OPay merchant identifier |
| `OPAY_PRIVATE_KEY` | OPay private key for HMAC signing |
| `OPAY_ENV` | `sandbox` (default) or `production` |

### 3.4 OPay Card — Notes

> Non-3DS flow only. OPay Wallet excluded from Phase 1. No 3DS redirect or Wallet UI required.

---

## 4. OPay Refund Flow

### 4.1 Backend (`POST /payments/opay/refund`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| R1 | Route requires JWT auth | ✅ | |
| R2 | Supports `bookingType: 'stay' \| 'experience'` | ✅ | |
| R3 | `reason` field optional | ✅ | |
| R4 | `refundOpayBooking()` method in `PaymentsService` | ✅ | |
| R5 | Verifies booking belongs to requesting user | ✅ | `ForbiddenException` thrown otherwise |
| R6 | `payment_status` set to `'refunded'` on success | ✅ | |
| R7 | Refund notification email sent to guest | ✅ | `tplRefundNotification` |
| R8 | OPay refund request sent to correct env endpoint | ✅ | Same `opayBaseUrl` used as payment |

### 4.2 OPay Refund — Verified
| # | Item | Status | Notes |
|---|------|--------|-------|
| R-G1 | **Frontend refund trigger**: Guest cancellation auto-calls `paymentsService.triggerOpayRefund()` | ✅ | Wired in `bookings.service.ts` `cancel()` method |
| R-G2 | **Partial refund per cancellation policy**: `calculateRefund()` applies flexible / moderate / strict window percentages | ✅ | Implemented in `bookings.service.ts` |

---

## 5. InstaPay Workflow

### 5.1 Guest Flow (`InstapayModal.tsx`)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| I1 | **Step 1 — Instructions**: Shows platform InstaPay phone number (`NEXT_PUBLIC_INSTAPAY_PHONE`) and account name (`NEXT_PUBLIC_INSTAPAY_NAME`) | ✅ | Shows "InstaPay Temporarily Unavailable" error state if env not set — blocks wrong phone from being shown |
| I2 | Amount to transfer displayed clearly | ✅ | Uses `formatPrice()` with currency |
| I3 | Copy phone-number button | ✅ | `navigator.clipboard.writeText()` |
| I4 | **Step 2 — Reference**: Transaction reference input (required) | ✅ | |
| I5 | Optional note / message field | ✅ | |
| I6 | Optional screenshot upload (JPG/PNG/WebP, max 10 MB) | ✅ | `POST /bookings/:id/upload-payment-proof` |
| I7 | Screenshot preview shown before submit | ✅ | `URL.createObjectURL()` |
| I8 | Submit calls `PATCH /bookings/:id/submit-payment` | ✅ | `bookingsApi.submitPayment()` |
| I9 | `payment_status` → `'submitted'` after submit | ✅ | |
| I10 | `payment_proof_url` saved when screenshot uploaded | ✅ | |
| I11 | **Step 3 — Done**: Confirmation message, `onSuccess('instapay')` fires | ✅ | |
| I12 | Error toast on submission failure | ✅ | `toast.error(t('couldNotSubmit'))` |

### 5.2 Required Environment Variables — InstaPay (Frontend)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_INSTAPAY_PHONE` | Platform InstaPay phone number to display to guests |
| `NEXT_PUBLIC_INSTAPAY_NAME` | Platform account name for InstaPay |

### 5.3 Admin Verification Flow
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| I13 | Admin bookings page shows `payment_status = 'submitted'` bookings | ✅ | Filter/column in admin bookings table |
| I14 | Admin can view payment reference and screenshot proof | ✅ | Shown in booking detail view |
| I15 | `POST /admin/bookings/:id/confirm-payment` → `payment_status` → `'paid'` | ✅ | `adminApi.confirmPayment()` wired |
| I16 | `POST /admin/bookings/:id/decline-payment` → `payment_status` → `'declined'` | ✅ | `adminApi.declinePayment(id, reason)` wired |
| I17 | Email sent to guest on confirmation | ✅ | `tplInstapayPaymentConfirmed` — called in `confirmPayment()` |
| I18 | Email sent to guest on decline (with reason) | ✅ | `tplInstapayPaymentDeclined` — called in `declinePayment()` |

### 5.4 InstaPay Refund Queue (Admin)
| # | Feature | Status | Notes |
|---|---------|--------|-------|
| I19 | `GET /admin/payments/instapay-refunds-pending` lists cancelled InstaPay bookings needing manual refund | ✅ | `adminApi.getInstapayRefundsPending()` |
| I20 | Admin panel page `/payments/instapay-refunds` renders the pending list | ✅ | `instapay-refunds/page.tsx` — shows booking details, amounts, guest info |
| I21 | "Action Required" alert banner visible | ✅ | |
| I22 | Refresh button on the page | ✅ | |
| I23 | Admin marks refund as complete in booking record | ✅ | "Mark Refunded" button added to admin page — 2-step inline confirm → `POST /admin/bookings/:id/mark-instapay-refunded` → `payment_status` = `'refunded'` |
| I24 | Guest notified when InstaPay refund is processed | ✅ | `tplInstapayRefundCompleted` email + in-app notification sent via `markInstapayRefunded()` |

### 5.5 Known Gaps — InstaPay
| # | Gap | Severity |
|---|-----|----------|
| I-G1 | **`NEXT_PUBLIC_INSTAPAY_PHONE` env validation**: `INSTAPAY_MISCONFIGURED` guard added — modal shows locked error state when env var is missing instead of defaulting to a placeholder number | ✅ Resolved |
| I-G2 | **Booking auto-decline timeout**: Hourly cron job `autoDeclineStaleInstapaySubmissions()` in `scheduler.service.ts` — declines submissions with no admin action after 48 h, sends `tplInstapayPaymentDeclined` email | ✅ Resolved |
| I-G3 | **Re-upload proof**: `submitPayment()` now allows re-submission when `paymentStatus = 'submitted'` or `'declined'` | ✅ Resolved |

---

## 6. Database Schema — Payment Columns

All columns exist in the `bookings` table (verified via migrations):

```sql
payment_status  ENUM('pending','submitted','paid','refunded','declined')
payment_method  ENUM('instapay','cash','card','stripe','opay-card','opay-wallet')
payment_reference      VARCHAR(100)
payment_note           TEXT
payment_proof_url      VARCHAR(500)
stripe_payment_intent_id  VARCHAR(255)
opay_order_reference   VARCHAR(100)
```

> **Note:** `opay-wallet` and `cash` are in the enum but have no frontend payment path in Phase 1. They are valid values but not user-facing.

---

## 7. Email Notifications Coverage

| Event | Template | Status |
|-------|----------|--------|
| Booking confirmed (any payment method) | `tplBookingConfirmed` | ✅ |
| Payment invoice | `tplPaymentInvoice` | ✅ |
| Stripe refund issued | `tplRefundNotification` | ✅ |
| OPay refund issued | `tplRefundNotification` | ✅ |
| InstaPay payment confirmed by admin | `tplInstapayPaymentConfirmed` | ✅ |
| InstaPay payment declined by admin (incl. auto-decline) | `tplInstapayPaymentDeclined` | ✅ |
| InstaPay refund pending (on cancellation) | `tplInstapayRefundPending` | ✅ |
| InstaPay refund completed (admin marks done) | `tplInstapayRefundCompleted` | ✅ |

---

## 8. Summary

### Remaining Open Items
> All Phase 1 audit items are ✅ resolved. No remaining open items.

### Resolved This Audit
| Item | How |
|------|-----|
| OPay 3DS / Wallet | **Excluded** — non-3DS OPay only; no Wallet in Phase 1 |
| Cancellation policy partial-refund | ✅ `calculateRefund()` in `bookings.service.ts` applies flexible/moderate/strict % |
| `NEXT_PUBLIC_INSTAPAY_PHONE` guard | ✅ `INSTAPAY_MISCONFIGURED` locks modal with error state |
| Guest OPay refund on cancellation | ✅ `triggerOpayRefund()` called in `cancel()` |
| Admin "Mark Refunded" button | ✅ Added to `instapay-refunds/page.tsx` with 2-step confirm + toast |
| Guest notification on refund completed | ✅ `tplInstapayRefundCompleted` email + in-app notification |
| All InstaPay email templates | ✅ All 4 templates verified/added in `mail.service.ts` |
| InstaPay 48 h auto-decline cron | ✅ Hourly cron in `scheduler.service.ts` |
| Re-upload InstaPay proof | ✅ `submitPayment()` allows re-submission from `submitted`/`declined` state |
