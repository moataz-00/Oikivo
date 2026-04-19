# Oikivo — Payment Processing Guide (OPay + Stripe)

> Last updated: April 2026  
> Scope: Backend (`packages/backend/src/payments/`) · Admin panel · Mobile/Web checkout

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [OPay vs Stripe — When to Use Which](#2-opay-vs-stripe--when-to-use-which)
3. [OPay Credentials & Environment Setup](#3-opay-credentials--environment-setup)
4. [Request Signature (Authentication)](#4-request-signature-authentication)
5. [Non-3DS Card Payment Flow](#5-non-3ds-card-payment-flow)
6. [Security Checks Before Charging](#6-security-checks-before-charging)
7. [Credit Card vs Debit Card](#7-credit-card-vs-debit-card)
8. [Payment Status Lifecycle](#8-payment-status-lifecycle)
9. [OPay Callback (Webhook)](#9-opay-callback-webhook)
10. [Querying Payment Status (Pull)](#10-querying-payment-status-pull)
11. [Refund Process — OPay](#11-refund-process--opay)
12. [Refund Process — InstaPay (Admin Panel Only)](#12-refund-process--instapay-admin-panel-only)
13. [Refund Process — Stripe](#13-refund-process--stripe)
14. [Admin Panel — Payment & Refund Actions](#14-admin-panel--payment--refund-actions)
15. [Error Codes Reference](#15-error-codes-reference)
16. [Security Hardening Checklist](#16-security-hardening-checklist)
17. [Environment Variables](#17-environment-variables)
18. [Testing (Sandbox)](#18-testing-sandbox)
19. [OPay API Endpoints Summary](#19-opay-api-endpoints-summary)

---

## 1. Architecture Overview

```
Guest (Mobile/Web)
      │
      ▼
Oikivo Backend (NestJS)
  POST /payments/opay/card         → OPay Non-3DS API  → OPay servers  → Card Issuing Bank
  POST /payments/opay/refund       → OPay Refund API
  POST /payments/opay/callback     ← OPay servers push status updates (webhook)
  POST /payments/create-intent     → Stripe (card, Apple Pay, Google Pay)
  POST /payments/refund            → Stripe Refund API
  POST /payments/webhook           ← Stripe pushes events
      │
      ▼
PostgreSQL (BookingEntity · EarningEntity)
```

### Payment methods supported

| Method | How initiated | Refund path |
|--------|--------------|-------------|
| **OPay card (Non-3DS)** | Guest enters card on checkout form | Backend → OPay Refund API |
| **Stripe card / Apple Pay / Google Pay** | Stripe SDK on client | Backend → Stripe Refund API |
| **InstaPay (manual bank transfer)** | Guest sends transfer, uploads screenshot | **Admin panel manual review** |

---

## 2. OPay vs Stripe — When to Use Which

| Scenario | Recommended gateway |
|----------|-------------------|
| Egyptian guest, EGP booking | **OPay** — lower fees, local rails |
| Non-Egyptian guest, foreign currency | **Stripe** |
| Guest without Egyptian bank card | **Stripe** (international cards) |
| Repeat guest who wants saved card / 3DS flow | **Stripe** |
| InstaPay/mobile wallet transfer | Manual InstaPay path (admin confirmation) |

---

## 3. OPay Credentials & Environment Setup

### Required environment variables

```env
# ── OPay ──────────────────────────────────────────────────────────────────────
OPAY_MERCHANT_ID=256612345678901        # From OPay merchant dashboard
OPAY_PRIVATE_KEY=OPAYPRV*******0187828  # SHA-512 HMAC signing key — NEVER commit to git
OPAY_ENV=sandbox                        # 'sandbox' or 'production'

# ── Callback / Return URLs ────────────────────────────────────────────────────
BACKEND_URL=https://api.oikivo.com/api  # Used to build callbackUrl
FRONTEND_URL=https://oikivo.com        # Used to build returnUrl
```

### API base URLs

| Environment | Base URL |
|-------------|----------|
| Sandbox | `https://sandboxapi.opaycheckout.com` |
| Production | `https://api.opaycheckout.com` |

The backend automatically selects the correct URL based on `OPAY_ENV`.

---

## 4. Request Signature (Authentication)

OPay uses **SHA-512 HMAC** signed with your private key.  
**Every request** must include two headers:

```http
Authorization: Bearer {signature}
MerchantId: {OPAY_MERCHANT_ID}
```

### How the signature is computed (current implementation)

```typescript
// packages/backend/src/payments/payments.service.ts

private generateOpaySignature(body: object): string {
  // 1. Sort all object keys alphabetically (recursive)
  const sorted = this.sortObjectKeys(body);
  // 2. Serialize to JSON
  const bodyStr = JSON.stringify(sorted);
  // 3. HMAC-SHA512 with private key
  return crypto.createHmac('sha512', this.opayPrivateKey).update(bodyStr).digest('hex');
}
```

> **Critical:** OPay requires keys to be **sorted alphabetically before signing**. Failing to sort will result in a `02000 authentication failed` error.

---

## 5. Non-3DS Card Payment Flow

### Step-by-step

```
1. Guest fills card form on Oikivo checkout (cardNumber, expiryMonth, expiryYear, cvv, cardHolderName)
2. Mobile/Web sends POST /payments/opay/card
3. Backend validates booking state (not paid, not cancelled, not duplicate)
4. Backend generates unique reference: js-s-{bookingId}-{timestamp_base36}
5. Backend persists reference to booking row (before hitting OPay)
6. Backend calls POST /api/v1/international/payment/create on OPay
7. OPay returns one of: SUCCESS / PENDING / FAIL / CLOSE
8. Backend updates booking.paymentStatus + creates EarningEntity in a single DB transaction
9. Backend returns { status: 'success' | 'pending' | 'failed', orderNo?, message? } to client
10. OPay also calls callbackUrl (POST /payments/opay/callback) asynchronously
```

### Request payload sent to OPay

```json
{
  "country": "EG",
  "reference": "js-s-42-lxyz123",
  "amount": {
    "currency": "EGP",
    "total": 45000
  },
  "bankcard": {
    "cardHolderName": "AHMED HASSAN",
    "cardNumber": "4508750015741019",
    "expiryMonth": "02",
    "expiryYear": "26",
    "cvv": "100",
    "enable3DS": false
  },
  "payMethod": "BankCard",
  "product": {
    "name": "Oikivo booking #42",
    "description": "Property stay booking"
  },
  "userInfo": {
    "userName": "AHMED HASSAN",
    "userMobile": "201012345678",
    "userEmail": "guest@example.com"
  },
  "callbackUrl": "https://api.oikivo.com/api/payments/opay/callback",
  "returnUrl": "https://oikivo.com/en/trips"
}
```

> **Amount unit:** OPay uses the **smallest currency unit** (piastres for EGP).  
> `450 EGP × 100 = 45000 piastres`. The backend handles this conversion automatically.

### Successful response from OPay

```json
{
  "code": "00000",
  "message": "SUCCESSFUL",
  "data": {
    "reference": "js-s-42-lxyz123",
    "orderNo": "211004140885521681",
    "status": "SUCCESS",
    "amount": { "total": 45000, "currency": "EGP" }
  }
}
```

---

## 6. Security Checks Before Charging

### 6.1 Card validation (client-side, pre-submission)

These checks must be performed in the mobile/web checkout form **before** sending the request to the backend:

| Check | Rule | Notes |
|-------|------|-------|
| Card number format | Luhn algorithm check | 16-digit Visa/Mastercard |
| Expiry not in the past | `(year > current_year) OR (year === current_year AND month >= current_month)` | Show `MM/YY` picker |
| CVV length | 3 digits for Visa/MC, 4 for Amex | Regex: `/^\d{3,4}$/` |
| Cardholder name | Not empty, letters only | Regex: `/^[A-Za-z\s\-']+$/` |
| Card number not empty | Required | — |

> **Never log or store raw card numbers.** They are passed directly to OPay and should not touch Oikivo's database.

### 6.2 Card availability — what OPay checks

OPay's acquiring system performs the following at the issuing bank level:

| OPay check | What it means | Response signal |
|-----------|--------------|-----------------|
| **Card exists** | Card number registered at issuing bank | `status: FAIL`, `failureCode: CARD_NOT_FOUND` or similar |
| **Card not expired** | Expiry date valid | `status: FAIL` |
| **Card not blocked/frozen** | Card in active state | `status: FAIL`, `failureCode: DO_NOT_HONOUR` |
| **Sufficient funds** | Available balance ≥ transaction amount | `status: FAIL`, `failureCode: INSUFFICIENT_FUNDS` |
| **3DS not required** (Non-3DS flow) | Issuing bank allows non-3DS for this card | `status: FAIL` if bank requires 3DS — switch to 3DS endpoint in that case |

### 6.3 Backend-side guards (already implemented)

```typescript
// payments.service.ts — createOpayCardPayment()

if (!this.opayMerchantId || !this.opayPrivateKey)
  throw new BadRequestException('OPay is not configured on this server');

if (!booking) throw new NotFoundException('Booking not found');
if (booking.guestId !== userId) throw new ForbiddenException('Not your booking');

if (['cancelled', 'declined'].includes(booking.status))
  throw new BadRequestException('This booking can no longer be paid');

if (booking.paymentStatus === 'paid')
  throw new BadRequestException('Booking is already paid');

if (booking.paymentStatus === 'submitted')   // InstaPay pending
  throw new BadRequestException('An InstaPay payment is pending admin verification');
```

### 6.4 Idempotency — duplicate payment prevention

The backend persists `opayOrderReference` to the booking row **before** calling OPay. If the app crashes mid-request, the reference is still stored and can be looked up to avoid creating a second charge.

Rate limiting is applied: **5 requests per 60 seconds** per authenticated user on the `/payments/opay/card` endpoint (via NestJS Throttler).

### 6.5 Callback signature verification

When OPay sends a callback to `/payments/opay/callback`, the backend re-computes the HMAC and rejects any callback where the signature does not match:

```typescript
const expectedSig = this.generateOpaySignature(body);
const receivedSig = authHeader.replace(/^Bearer\s+/i, '');

if (receivedSig !== expectedSig) {
  this.logger.warn('OPay callback signature mismatch — rejected');
  return; // silently ignore; do NOT throw (OPay may retry)
}
if (merchantIdHeader !== this.opayMerchantId) {
  this.logger.warn('OPay callback MerchantId mismatch — rejected');
  return;
}
```

---

## 7. Credit Card vs Debit Card

### Why credit cards are strongly preferred for OPay transactions

| Factor | Credit Card | Debit Card |
|--------|-------------|------------|
| **Authorization hold** | Card issuer pre-authorizes amount, money moves only on capture | Funds deducted immediately from checking account |
| **Chargeback / dispute rights** | Full chargeback protection via Visa/MC network | Limited or no chargeback — depends on issuing bank |
| **Refund timing** | Credit posted back to available credit line within 3–5 days | Funds returned to bank account; can take 5–10 business days |
| **Insufficient funds failure mode** | Declined cleanly — no overdraft | May cause overdraft fee for the guest |
| **Non-3DS acceptance rate** | Higher — issuers trust credit cards for larger amounts without 3DS | Lower — banks more likely to require 3DS step-up for debit |
| **Guest protection (hosting context)** | If property is misrepresented, guest can dispute with card issuer | Harder to recover |

### Oikivo recommendation

> For the Non-3DS flow, **strongly recommend credit cards** in the checkout UI.  
> Add helper text: *"For best results and easier refunds, use a credit card."*  
> If the card is declined and `failureCode` indicates a 3DS requirement, **fall back to the 3DS endpoint** (`enable3DS: true`) rather than showing a generic error.

### Detecting card type on front-end (client-side only, informational)

```typescript
// Detect Visa / Mastercard from first digits (for UI display only — never for authorization logic)
function getCardType(cardNumber: string): 'visa' | 'mastercard' | 'unknown' {
  const n = cardNumber.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  return 'unknown';
}
```

> You **cannot determine credit vs debit from the card number alone** — that requires a BIN lookup service. The card type UI hint is purely cosmetic.

---

## 8. Payment Status Lifecycle

### OPay statuses

| Status | Meaning | Oikivo action |
|--------|---------|--------------|
| `INITIAL` | Request received, processing not started | Poll status endpoint |
| `PENDING` | Payment in progress at issuing bank | Notify guest to wait; OPay will callback |
| `SUCCESS` | Payment completed | Mark `paymentStatus = 'paid'`, `status = 'confirmed'`, create `EarningEntity` |
| `FAIL` | Payment rejected (card issue, insufficient funds, etc.) | Show failure reason to guest; allow retry |
| `CLOSE` | Payment expired or cancelled | Allow guest to retry |

### Oikivo `booking.paymentStatus` values

| Value | Meaning |
|-------|---------|
| `pending` | No payment attempt yet |
| `submitted` | InstaPay transfer uploaded, waiting for admin |
| `paid` | Payment confirmed (OPay SUCCESS or Stripe webhook) |
| `refunded` | Full or partial refund issued |
| `failed` | Payment failed (not retried) |

---

## 9. OPay Callback (Webhook)

OPay **pushes** payment status to `POST /payments/opay/callback` whenever a transaction status changes. This is the **primary mechanism** for confirming payments — do not rely solely on the synchronous API response.

### Callback payload (example)

```json
{
  "reference": "js-s-42-lxyz123",
  "orderNo": "211004140885521681",
  "status": "SUCCESS",
  "amount": { "total": 45000, "currency": "EGP" }
}
```

### How the backend processes it

1. Verifies HMAC signature and MerchantId headers
2. Looks up booking by `opayOrderReference`
3. If `status === 'SUCCESS'` and booking not yet paid:
   - Wraps DB update in a **transaction**: `paymentStatus = 'paid'`, `status = 'confirmed'`, creates `EarningEntity`
4. If refund callback (`orderStatus === 'SUCCESS'` on a refund ref pattern):
   - Updates booking to `paymentStatus = 'refunded'`

### Configure the webhook URL in OPay dashboard

Go to **OPay Merchant Dashboard → Settings → Webhook URL** and set:

```
https://api.oikivo.com/api/payments/opay/callback
```

Or pass `callbackUrl` in each payment request body (already done in the implementation).

---

## 10. Querying Payment Status (Pull)

If the callback is delayed or you need to cross-check, poll the OPay Query Payment Status API.

### Endpoint

```
POST /api/v1/international/cashier/status
```

### Request body

```json
{
  "reference": "js-s-42-lxyz123",
  "country": "EG"
}
```

### Response

```json
{
  "code": "00000",
  "message": "SUCCESSFUL",
  "data": {
    "reference": "js-s-42-lxyz123",
    "orderNo": "211004140885521681",
    "status": "SUCCESS",
    "amount": { "total": 45000, "currency": "EGP" },
    "createTime": 1712919600000,
    "isVoided": false
  }
}
```

### When to poll

- **30 seconds** after a `PENDING` response — once
- **5 minutes** after — if still PENDING
- **Do not poll more than 3 times** — if still unresolved, treat as PENDING and wait for callback

> The backend does not currently expose a guest-facing polling endpoint. Add `GET /payments/opay/status/:bookingId` if needed for the mobile app to show a "Checking payment..." spinner.

---

## 11. Refund Process — OPay

### Who can trigger a refund

| Actor | Can trigger | API endpoint |
|-------|------------|-------------|
| Guest (via mobile/web) | For their own OPay-paid bookings | `POST /payments/opay/refund` |
| Host | For bookings where they are authorized | `POST /payments/opay/refund` |
| Admin (via admin panel) | For any booking | Admin panel action → same service method |
| Backend (automatic) | When booking is cancelled with a valid refund policy | `triggerOpayRefund()` in BookingsService |

### Refund API call

```
POST /api/v1/international/payment/refund/create
```

#### Request body

```json
{
  "country": "EG",
  "reference": "js-s-42-lxyz123-ref",
  "originalReference": "js-s-42-lxyz123",
  "amount": {
    "currency": "EGP",
    "total": 45000
  },
  "callbackUrl": "https://api.oikivo.com/api/payments/opay/callback",
  "refundReason": "Guest cancelled — flexible policy"
}
```

| Field | Notes |
|-------|-------|
| `reference` | **New unique reference** for the refund — append `-ref` suffix (or random hex) to original |
| `originalReference` | The `opayOrderReference` stored on the booking |
| `amount.total` | Piastres. Can be less than original for **partial refund** |
| `refundReason` | Optional — shown in OPay dashboard |

#### Successful response

```json
{
  "code": "00000",
  "message": "SUCCESSFUL",
  "data": {
    "reference": "js-s-42-lxyz123-ref",
    "originalReference": "js-s-42-lxyz123",
    "orderNo": "211003140885499643",
    "originalOrderNo": "211004140885521681",
    "country": "EG",
    "refundAmount": { "currency": "EGP", "total": 45000 },
    "orderStatus": "SUCCESS"
  }
}
```

### Refund status values

| Status | Meaning |
|--------|---------|
| `INITIAL` | Refund request received |
| `PENDING` | Being processed by OPay / bank |
| `SUCCESS` | Refund completed — funds back to card |
| `FAIL` | Refund failed (contact OPay support) |

### Checking refund status

```
POST /api/v1/international/payment/refund/query
```

```json
{
  "reference": "js-s-42-lxyz123-ref",
  "country": "EG"
}
```

### Refund timeline

| Card type | Expected time |
|-----------|--------------|
| Credit card | 3–5 business days |
| Debit card | 5–10 business days |
| OPay Wallet | Near-instant |

### Partial refund rules

- Booking with `refundAmount` field set → refunds that specific amount
- No `refundAmount` → full refund of `totalAmount`
- **Cannot refund more than the original charge** — OPay will reject with error `91`
- **Cannot refund a booking that was not paid via OPay** — `booking.opayOrderReference` must exist

---

## 12. Refund Process — InstaPay (Admin Panel Only)

InstaPay is an Egyptian instant bank transfer system. Guests pay by sending money to the Oikivo InstaPay number and uploading a screenshot as proof. **OPay and Stripe have no involvement** in InstaPay transactions.

### Why InstaPay refunds go through the admin panel

InstaPay is a **push transfer** — the guest initiates the payment from their banking app. There is no API for Oikivo to trigger a reversal. The only way to refund is for the **admin (or finance team) to manually send money back** to the guest's account.

### Guest-facing flow

```
1. Guest selects "InstaPay" on checkout
2. Guest transfers amount to Oikivo's InstaPay ID
3. Guest uploads screenshot in the app
4. booking.paymentStatus = 'submitted'
5. Admin reviews screenshot in admin panel
6. Admin confirms → booking.paymentStatus = 'paid', booking.status = 'confirmed'
   OR Admin rejects → booking retains 'submitted' status, guest notified
```

### Admin refund flow for InstaPay

```
1. Admin opens booking in admin panel
2. Admin panel shows: paymentMethod = 'instapay', paymentStatus = 'paid'
3. Admin verifies refund is warranted (cancellation policy, dispute, etc.)
4. Admin initiates bank transfer manually (outside the system)
5. Admin records refund: POST /admin/bookings/:id/mark-refunded
   Body: { refundAmount, refundNotes, refundReference }
6. System sets booking.paymentStatus = 'refunded' and sends guest notification email
```

### Admin endpoint to mark InstaPay booking as refunded

```http
POST /admin/bookings/:id/mark-refunded
Authorization: Bearer {admin_jwt}

{
  "refundAmount": 450.00,
  "refundNotes": "Full refund — host cancelled",
  "refundReference": "INSTAPAY-REF-20260412"
}
```

> **This endpoint must be implemented in the admin module.** It should be restricted to `role = 'admin'` and must create an audit log entry.

### Security considerations for InstaPay

- Screenshots can be forged → admin must cross-check against Oikivo's **received transfers ledger** before marking paid
- Never auto-confirm InstaPay without human review
- Set maximum wait time: if admin does not review within **7 days**, auto-expire and refund guest (send email)

---

## 13. Refund Process — Stripe

Stripe refunds are fully automated via the Stripe API.

```typescript
// payments.service.ts — refundStayBooking()

const refund = await this.stripe.refunds.create({
  payment_intent: booking.stripePaymentIntentId,
  amount: booking.refundAmount             // undefined = full refund
    ? this.toSmallestUnit(Number(booking.refundAmount), currency)
    : undefined,
});

await this.bookingsRepo.update(bookingId, {
  paymentStatus: 'refunded',
  refundReason: reason,
  stripeRefundId: refund.id,   // stored for reconciliation
});
```

Stripe refunds reach the guest's card in **5–10 business days** (varies by bank).  
`stripeRefundId` is stored on the booking for reconciliation in Stripe dashboard.

---

## 14. Admin Panel — Payment & Refund Actions

### What admins can see per booking

| Field | Source |
|-------|--------|
| `paymentMethod` | `'stripe'` / `'opay-card'` / `'instapay'` / `'cash'` |
| `paymentStatus` | `pending` / `submitted` / `paid` / `refunded` / `failed` |
| `stripePaymentIntentId` | Stripe PI reference |
| `stripeRefundId` | Stripe refund reference |
| `opayOrderReference` | OPay merchant reference (`js-s-{id}-...`) |

### Admin actions

| Action | When available | Effect |
|--------|---------------|--------|
| **Confirm InstaPay** | `paymentMethod = 'instapay'`, `paymentStatus = 'submitted'` | Sets `paid` + `confirmed`, creates EarningEntity |
| **Reject InstaPay** | `paymentMethod = 'instapay'`, `paymentStatus = 'submitted'` | Sets `pending`, notifies guest |
| **Trigger OPay refund** | `paymentMethod = 'opay-card'`, `paymentStatus = 'paid'` | Calls OPay Refund API, sets `refunded` |
| **Trigger Stripe refund** | `paymentMethod = 'stripe'`, `paymentStatus = 'paid'` | Calls Stripe refund, sets `refunded` |
| **Mark InstaPay refunded** | `paymentMethod = 'instapay'`, `paymentStatus = 'paid'` | Manual — admin records it after bank transfer |
| **View OPay order** | Any OPay booking | Link to OPay merchant dashboard with `opayOrderReference` |

### OPay merchant dashboard

Log in at [https://merchant.opaycheckout.com](https://merchant.opaycheckout.com) to:
- View all transactions
- Issue manual refunds (alternative to API)
- Download settlement reports
- Check chargebacks

---

## 15. Error Codes Reference

### OPay general error codes

| Code | Meaning | Action |
|------|---------|--------|
| `00000` | Successful | Proceed |
| `02000` | Authentication failed | Check signature computation, key, sorting |
| `02001` | Request params not valid | Validate required fields |
| `02002` | Merchant not configured with this function | Enable feature in OPay dashboard |
| `02003` | PayMethod not supported | Change `payMethod` |
| `02004` | Payment reference already exists | Generate a new unique reference |
| `02006` | Original payment not found | Verify `originalReference` is correct |
| `02007` | Merchant not available | Contact OPay support |
| `50003` | Service not available | Retry with exponential backoff |

### OPay refund-specific error codes

| Code | Meaning |
|------|---------|
| `09` | Timeout — retry |
| `20000` | Duplicate refund reference — generate new ref |
| `91` | Refund error — contact OPay support |
| `96` | Order lookup error — retry |

### Payment `failureCode` values (on card rejection)

| failureCode | Meaning | What to show guest |
|-------------|---------|-------------------|
| `INSUFFICIENT_FUNDS` | Card does not have enough balance | "Insufficient funds — try a different card or add funds" |
| `DO_NOT_HONOUR` | Bank blocked the transaction | "Your bank declined this transaction — contact your bank" |
| `EXPIRED_CARD` | Card expired | "This card has expired — please use a different card" |
| `INVALID_CARD` | Card number invalid | "Invalid card number — please check and retry" |
| `CARD_NOT_FOUND` | Card not registered | "This card was not found — please use a different card" |
| `TRANSACTION_NOT_ALLOWED` | Card type not supported | "This card type is not supported — try a Visa or Mastercard" |

---

## 16. Security Hardening Checklist

### OWASP Top 10 compliance

- [x] **Injection** — No raw SQL. All queries via TypeORM repository methods with parameterized inputs
- [x] **Broken authentication** — JWT guard on all payment endpoints; OPay callback verified via HMAC
- [x] **Sensitive data exposure** — Card numbers never stored in database; only OPay order reference stored
- [x] **XML/SSRF** — OPay calls made from backend only, destination URL fixed in config (not user-supplied)
- [x] **Broken access control** — `guestId !== userId` check; admin refund endpoint gated by admin role
- [x] **Rate limiting** — 5 requests / 60 s on `/opay/card` and `/create-intent` via NestJS Throttler
- [x] **Idempotency** — Reference saved to DB before OPay call; Stripe re-uses existing PaymentIntent
- [x] **Duplicate payment prevention** — `paymentStatus === 'paid'` and `=== 'submitted'` guards
- [x] **Callback authenticity** — HMAC re-computed on every incoming OPay callback; MerchantId checked

### Additional hardening tasks (TODO)

- [x] **HTTPS only** — `BACKEND_URL` now throws on startup in production if not `https://` (payments.service.ts constructor)
- [ ] **PCI-DSS scope reduction** — Card data collected in client and sent directly to backend, which forwards to OPay without persisting. Consider OPay's hosted fields / JS SDK to keep card data from ever touching Oikivo servers
- [x] **OPay 3DS fallback** — Pass `force3DS: true` in the card payment request body to retry with `enable3DS: true`; returns `{ status: '3ds-redirect', redirectUrl }` with the OPay cashier URL. On `FAIL` without 3DS, response includes `suggestRetry3DS: true`
- [x] **Refund amount cap** — `refundOpayBooking()` now throws `BadRequestException` if `refundAmount > totalAmount`
- [x] **Audit log** — `AuditLogService` injected into `PaymentsService`; logs `payment.opay.success`, `payment.opay.failed`, `payment.opay.3ds_redirect`, and `payment.opay.refund` events
- [x] **Admin IP allowlist** — `AdminIpAllowlistGuard` applied to all admin routes; set `ADMIN_IP_ALLOWLIST=ip1,ip2` env var to restrict access (empty = allow all for backwards compatibility)
- [ ] **InstaPay screenshot storage** — Screenshots must be stored with access control (not public S3 URLs)

---

## 17. Environment Variables

Full reference for payment-related env vars:

```env
# ── Stripe ────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...             # Stripe secret key (production)
STRIPE_WEBHOOK_SECRET=whsec_...          # Stripe webhook signing secret

# ── OPay ──────────────────────────────────────────────────────────────────────
OPAY_MERCHANT_ID=256612345678901          # From OPay dashboard
OPAY_PRIVATE_KEY=OPAYPRV*******0187828   # HMAC signing key — keep secret
OPAY_ENV=production                       # 'sandbox' | 'production'

# ── URLs ──────────────────────────────────────────────────────────────────────
BACKEND_URL=https://api.oikivo.com/api   # For callbackUrl construction
FRONTEND_URL=https://oikivo.com         # For returnUrl construction
NODE_ENV=production                       # Enables strict Stripe key requirement
```

> In **sandbox** mode (`OPAY_ENV=sandbox`), use test card numbers from [OPay End-to-End Testing](https://doc.opaycheckout.com/end-to-end-testing).

---

## 18. Testing (Sandbox)

### OPay sandbox test cards

| Card number | Result |
|-------------|--------|
| `4508750015741019` | Success (Visa) |
| `5399999999999999` | Success (Mastercard) |
| Use any 3-digit CVV, any future expiry date | — |

Use these in sandbox mode (`OPAY_ENV=sandbox`) against:
```
https://sandboxapi.opaycheckout.com/api/v1/international/payment/create
```

### End-to-end test checklist

- [ ] Successful payment → booking `status = confirmed`, `paymentStatus = paid`
- [ ] EarningEntity created with correct `hostId`, `amount` (totalAmount − serviceFee)
- [ ] `opayOrderReference` saved to booking before OPay call
- [ ] Callback received and processed (check logs)
- [ ] Duplicate payment attempt rejected with 400
- [ ] Refund → booking `paymentStatus = refunded`
- [ ] Refund email sent to guest
- [ ] Invalid HMAC callback rejected (no DB changes)
- [ ] Rate limiter blocks 6th request in 60s window

---

## 19. OPay API Endpoints Summary

| Operation | Method | URL |
|-----------|--------|-----|
| Create card payment | POST | `/api/v1/international/payment/create` |
| Query payment status | POST | `/api/v1/international/cashier/status` |
| Create refund | POST | `/api/v1/international/payment/refund/create` |
| Query refund status | POST | `/api/v1/international/payment/refund/query` |
| Cancel payment | POST | `/api/v1/international/cashier/close` |
| Void payment | POST | `/api/v1/international/payment/void` |

All URLs are appended to the base URL (`sandboxapi.opaycheckout.com` or `api.opaycheckout.com`).

### Oikivo backend payment endpoints

| Operation | Method | Path | Auth |
|-----------|--------|------|------|
| Create Stripe intent | POST | `/payments/create-intent` | JWT |
| Stripe refund | POST | `/payments/refund` | JWT |
| OPay card payment | POST | `/payments/opay/card` | JWT |
| OPay refund | POST | `/payments/opay/refund` | JWT |
| OPay callback (webhook) | POST | `/payments/opay/callback` | HMAC (OPay) |
| Stripe webhook | POST | `/payments/webhook` | Stripe signature |

---

## Related Documentation

- [OPay Non-3DS API](https://doc.opaycheckout.com/non-3DS-API)
- [OPay Refund API](https://doc.opaycheckout.com/payment-refund)
- [OPay Query Refund Status](https://doc.opaycheckout.com/payment-refund-status)
- [OPay Query Payment Status](https://doc.opaycheckout.com/query-payment-status)
- [OPay Callback Notifications](https://doc.opaycheckout.com/payment-notifications-callbacks)
- [OPay Error Codes](https://doc.opaycheckout.com/error-codes)
- [OPay API Signature](https://doc.opaycheckout.com/api-signature)
- [OPay End-to-End Testing](https://doc.opaycheckout.com/end-to-end-testing)
- [Stripe SCA / 3DS docs](https://stripe.com/docs/strong-customer-authentication)
- [BOOKING_WORKFLOWS.md](./BOOKING_WORKFLOWS.md) — booking lifecycle
- [HOST_PROPERTY_AUDIT.md](./HOST_PROPERTY_AUDIT.md) — host-side audit
