# Security Deposit Process

## Overview

The security deposit on Oikivo is a **manual cash model**. No deposit money is ever charged or held by the platform. The platform's role is to record the deposit amount, track its status, and facilitate the review of any damage claims.

The deposit workflow is entirely offline between host and guest — the platform enforces accountability through documented claims, admin review, and automated notifications.

---

## Deposit Status Lifecycle

```
none  →  held  →  claimed  →  approved  (host keeps cash)
                           →  rejected  (host must return cash)
                ↘  released              (host voluntarily releases / no damage)
```

| Status     | Meaning |
|------------|---------|
| `none`     | No deposit applies to this booking |
| `held`     | Deposit applies; guest has acknowledged it; no claim has been submitted |
| `claimed`  | Host has submitted a damage claim; awaiting admin review |
| `released` | Host confirmed no damage; deposit returned to guest |
| `approved` | Admin approved the claim; host keeps the cash deposit |
| `rejected` | Admin rejected the claim; host must return cash to guest |

---

## Party Responsibilities

### Guest

1. **At booking**: The guest sees an amber notice about the deposit amount and damage liability. They must acknowledge it before the booking is confirmed.
2. **At check-in / check-out**: The guest pays the deposit amount in **cash** to the host (timing at host's discretion — typically at check-in).
3. **If no claim**: The host should mark the deposit as released after check-out with no damage.
4. **If claim is submitted**: The guest receives an email/notification informing them. They receive the admin's final decision by email too.
5. **If claim is rejected**: The host is required to return the cash to the guest within 48 hours.

### Host

1. **At check-in or check-out**: Collect the deposit amount in **cash** from the guest.
2. **If no damage**: Optionally mark the deposit as released (or take no action — `held` is the default terminal state with no damage).
3. **If damage occurs**: Submit a damage claim **within 48 hours of checkout**:
   - Provide a written reason describing the damage.
   - Upload up to 10 evidence photos.
   - Status changes from `held` → `claimed`.
4. **After submitting a claim** (while admin has not yet decided):
   - **Edit claim**: The host may update the reason or add more evidence photos if they made a mistake.
   - **Cancel claim**: If the host resolved the situation directly with the guest (e.g., the guest paid voluntarily), they can cancel the claim — status reverts to `held`.
5. **If claim is approved**: The host keeps the cash deposit. An email confirming the approval is sent automatically.
6. **If claim is rejected**: The host must return the full deposit amount in cash to the guest within **48 hours**. A rejection email is sent automatically.

### Admin

1. **Trigger**: Admin is notified when a host submits a deposit claim (`claimed` status).
2. **Review interface**: In the admin booking detail page, a dedicated **Security Deposit** panel shows:
   - The deposit amount and current status.
   - The host's claim reason.
   - Evidence photo thumbnails (click to open full-size).
3. **Decision**:
   - **Approve claim** (`POST /api/admin/bookings/:id/deposit/approve`):
     - Sets status → `approved`.
     - Sends email to host: "Your claim was approved. You may keep the deposit."
     - Sends email to guest: "The host's damage claim was approved. You are not entitled to a return of the deposit."
     - Sends in-app notification to both.
   - **Reject claim** (`POST /api/admin/bookings/:id/deposit/reject`):
     - Sets status → `rejected`.
     - Sends email to host: "Your claim was rejected. Please return the deposit to the guest within 48 hours."
     - Sends email to guest: "The host's damage claim was rejected. The host is required to return your deposit."
     - Sends in-app notification to both.

---

## API Endpoints

| Method   | Endpoint                                        | Actor | Description |
|----------|-------------------------------------------------|-------|-------------|
| `POST`   | `/api/bookings/:id/deposit/claim`               | Host  | Submit initial damage claim |
| `PATCH`  | `/api/bookings/:id/deposit/claim`               | Host  | Edit an existing claim (reason, evidence) |
| `DELETE` | `/api/bookings/:id/deposit/claim`               | Host  | Cancel a pending claim (reverts to `held`) |
| `PATCH`  | `/api/bookings/:id/deposit/release`             | Host  | Mark deposit as released to guest |
| `POST`   | `/api/admin/bookings/:id/deposit/approve`       | Admin | Approve a damage claim |
| `POST`   | `/api/admin/bookings/:id/deposit/reject`        | Admin | Reject a damage claim |
| `POST`   | `/api/bookings/:id/deposit/upload-evidence`     | Host  | Upload evidence photos (returns paths array) |

---

## Timelines

| Event | Deadline |
|-------|----------|
| Host submits initial damage claim | Within **48 hours** of checkout |
| Host can edit/cancel their claim | Any time before admin decision |
| Host returns cash if claim rejected | Within **48 hours** of rejection email |

---

## Key Design Decisions

- **No platform charge**: The platform never charges the deposit. This avoids payment gateway complexity and keeps the model simple for the Egyptian market.
- **Cash collection**: Host is responsible for collecting the cash offline. Platform records the amount for accountability and dispute reference.
- **48h claim window**: Enforced by `depositClaimDeadline` stored on the booking (set to checkout date + 48h). The `DepositClaimButton` component checks this deadline before allowing submission.
- **Evidence photos**: Stored in `uploads/payments/` folder, paths saved as a JSON array in `deposit_claim_evidence` column.
- **Edit before review**: Hosts can fix mistakes (wrong reason, missing photos) without cancelling and resubmitting, reducing admin noise.
- **Admin is the sole arbiter**: There is no dispute arbitration flow — the admin's decision is final and both parties are informed simultaneously.
