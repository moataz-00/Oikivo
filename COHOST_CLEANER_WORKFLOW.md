# Co-host & Cleaner — Full Workflow, API Reference & Gap Analysis

> **Last updated:** 2026-03-27 → **2026-03-28 (all gaps resolved)**  
> **Status:** ✅ Backend complete, ✅ Frontend complete (web), ❌ Mobile missing

---

## Table of Contents

1. [Concept Overview](#1-concept-overview)
2. [Data Model](#2-data-model)
3. [The Full Workflow — Step by Step](#3-the-full-workflow--step-by-step)
4. [Backend API Reference](#4-backend-api-reference)
5. [Frontend API Wrapper](#5-frontend-api-wrapper)
6. [What Is Already Built](#6-what-is-already-built)
7. [Missing APIs / Gaps](#7-missing-apis--gaps)
8. [Bugs Found](#8-bugs-found)
9. [Role Permissions Matrix](#9-role-permissions-matrix)
10. [Completed Work — All Done](#10-completed-work--all-done)

---

## 1. Concept Overview

A **Host** (property owner) can invite trusted people to help manage their listing.  
Two roles exist:

| Role | Label | Intended Access |
|------|-------|-----------------|
| `co_host` | Co-host | Full management: approve bookings, reply to guests, edit listing, view calendar |
| `cleaner` | Cleaner | Turnover notifications only (see checkout date → prepare unit) |

> **Important:** Co-hosts are a **host-side feature only**. They are NOT visible to guests.  
> A co-host is a **person** (a registered user), not a company or external service.

### Visual: Where to Find It

```
Hosting → Listings → [Select listing] → Co-hosts tab
URL: /hosting/listings/[uuid]/cohosts
```

---

## 2. Data Model

### Database Table: `cohosts`

```sql
CREATE TABLE cohosts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,   -- the listing
  host_id     BIGINT UNSIGNED NOT NULL,   -- the owner who sent the invite
  cohost_id   BIGINT UNSIGNED NOT NULL,   -- the person being invited
  role        ENUM('co_host','cleaner') NOT NULL DEFAULT 'co_host',
  status      ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cohost (property_id, cohost_id),   -- one record per user per property
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (host_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (cohost_id)   REFERENCES users(id)      ON DELETE CASCADE
);
```

### Entity: `CoHostEntity` (`packages/backend/src/entities/cohost.entity.ts`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Record ID (join table row) |
| `propertyId` | number | FK → properties |
| `hostId` | number | FK → users (the owner) |
| `cohostId` | number | FK → users (the invitee) |
| `role` | `'co_host' \| 'cleaner'` | |
| `status` | `'pending' \| 'accepted' \| 'declined'` | |
| `createdAt` | Date | |

### TypeScript Types (shared and web)

```typescript
// packages/shared/src/index.ts
export type CoHostRole   = 'co_host' | 'cleaner';
export type CoHostStatus = 'pending' | 'accepted' | 'declined';

// packages/web/src/types/index.ts
export interface CoHost {
  id: number;
  propertyId: number;
  hostId: number;
  cohostId: number;
  cohost: Partial<User>;   // joined user object of the invited person
  role: CoHostRole;
  status: CohostStatus;
  createdAt: string;
}
```

---

## 3. The Full Workflow — Step by Step

### 3.1 Host Invites Someone

```
Host goes to:  /hosting/listings/[uuid]/cohosts

1. Enters invitee's email address
2. Chooses role: "Co-host" or "Cleaner"
3. Clicks "Send Invitation"

→ Frontend calls:  POST /properties/:propertyId/cohosts
→ Backend:
     a. Verifies caller is the property owner
     b. Looks up user by email → if not found: 404 error
     c. Checks no existing record for (property, user) → if exists: 409 Conflict
     d. Creates record with status = 'pending'
     e. Returns the created CoHost record
→ Frontend shows new row in list with "pending" badge
→ Backend also:
     f. Sends an in-app `cohost_invite` notification to the invitee (B1)
     g. Sends an HTML invite email via `tplCohostInvite()` template (B2, non-fatal)
```

### 3.2 Invitee Sees and Responds to Invitation

```
Backend endpoint:  GET /cohosts/my-invites
→ Returns all cohosts records where cohostId = current user AND status = 'pending'
→ Includes property and host relations

Backend endpoint:  PATCH /properties/:propertyId/cohosts/:cohostId/respond
  Body: { "response": "accepted" | "declined" }
→ Updates status on the pending record
```

> ✅ **Invitations page (F1 + F2):** Available at `/account/invites` — shows pending invitations  
> with property image, host name, role badge, and Accept / Decline buttons that call  
> `cohostsApi.respond()`. The page is also linked from the `cohost_invite` notification (F4).

> ❌ **Mobile:** Zero cohost support on the mobile app. No pages, no API calls.

### 3.3 Co-host Manages the Listing

Once accepted, a co-host can access property management endpoints via the `CoHostGuard`.

```typescript
// packages/backend/src/common/guards/cohost.guard.ts
// Guard logic:
// 1. user.isAdmin  → allow
// 2. property.hostId === user.id  → allow (owner)
// 3. cohosts table has row where (propertyId, cohostId=user.id, status='accepted') → allow
// 4. @RequireCoHostRole(role) decorator present → cohost.role must match, else 403
// Otherwise → 403 Forbidden
```

> ✅ **Role-based access (B3):** The `@RequireCoHostRole('co_host' | 'cleaner')` decorator  
> (`cohosts/decorators/require-cohost-role.decorator.ts`) can be applied to any guarded route  
> to restrict access to a specific role. `CoHostGuard` reads the metadata via `Reflector`.

### 3.4 Host Removes a Co-host

```
Host clicks trash icon on a co-host row

→ Frontend calls:  DELETE /properties/:propertyId/cohosts/:cohostId
→ Backend:
     a. Verifies caller is the property owner
     b. Finds the record WHERE propertyId AND cohostId = :cohostId
     c. Hard deletes the record
```

> ✅ **Bug F3 fixed:** The frontend now passes `c.cohostId` (the invitee's user FK),  
> matching exactly what the backend uses to find the record:
> ```typescript
> onClick={() => removeMutation.mutate(c.cohostId)}   // ✅ user FK, not record PK
> ```

### 3.5 Re-invite After Decline

> ✅ **B4 fixed:** Use `PATCH /properties/:propertyId/cohosts/:cohostId/reinvite` to reset  
> a declined record's status back to `pending` and re-send the notification + email.  
> The unique constraint is preserved — no new record is created, the existing one is reactivated.  
> Declined co-hosts also show a `RotateCcw` re-invite button in the co-hosts management page.

---

## 4. Backend API Reference

> Base path: `http://localhost:3000/api`  
> All endpoints require: `Authorization: Bearer <jwt_token>`

### 4.1 `GET /properties/:propertyId/cohosts`

List all cohosts for a property.

**Access:** Owner or accepted co-host (enforced by `CoHostGuard`)

**Query params (B8):**
| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `page` | number | 1 | — | Page number |
| `limit` | number | 50 | 100 | Items per page |

**Success 200:**
```json
{
  "items": [
    {
      "id": 1,
      "propertyId": 42,
      "hostId": 17,
      "cohostId": 5,
      "cohost": {
        "id": 5,
        "firstName": "Sara",
        "lastName": "Hassan",
        "email": "sara@example.com",
        "avatarUrl": null
      },
      "role": "co_host",
      "status": "accepted",
      "createdAt": "2026-03-10T14:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

**Error cases:**
- `403 Forbidden` — not owner or accepted co-host
- `404 Not Found` — property doesn't exist

---

### 4.2 `POST /properties/:propertyId/cohosts`

Invite a co-host or cleaner.

**Access:** Property owner only (checked in service, not guard)

**Request body:**
```json
{
  "email": "person@example.com",
  "role": "co_host"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `email` | string | ✅ | Valid email of any registered user |
| `role` | string | ❌ (default: `co_host`) | `co_host` or `cleaner` |

**Success 201:** Returns the created `CoHost` object (with `cohost` user relation)

**Error cases:**
- `403 Forbidden` — caller is not the property owner
- `403 Forbidden` — trying to invite yourself
- `404 Not Found` — no user with that email exists (user must already be registered)
- `409 Conflict` — user already has a record (pending, accepted, or declined) for this property

> **Note:** If you try to invite a user whose status is already `declined`, this endpoint returns `409 Conflict`.  
> Use `PATCH /:cohostId/reinvite` (section 4.6) instead to reset a declined record to `pending`.

---

### 4.3 `PATCH /properties/:propertyId/cohosts/:cohostId/respond`

Accept or decline a pending invitation.

**Access:** Any authenticated user (the service restricts to the actual invitee by matching `cohostId = user.id`)

> **Note (B7):** The `:cohostId` URL param is now validated against the authenticated user's ID.  
> If `cohostId !== user.id`, the endpoint returns `403 Forbidden`. This ensures users can  
> only respond to their own invitations.

**Request body:**
```json
{
  "response": "accepted"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `response` | string | ✅ | `accepted` or `declined` |

**Success 200:** Returns updated `CoHost` object

**Error cases:**
- `403 Forbidden` — `:cohostId` does not match the authenticated user's ID
- `404 Not Found` — no pending invite found for this user + property combo

---

### 4.4 `DELETE /properties/:propertyId/cohosts/:cohostId`

Remove a co-host from a property.

**Access:** Property owner only

> `:cohostId` is the co-host's **user ID** (the `cohostId` foreign key), not the primary key  
> of the cohosts table row. The frontend correctly passes `c.cohostId` (bug F3 fixed).

**Success 200:**
```json
{ "message": "Cohost removed successfully" }
```

**Error cases:**
- `403 Forbidden` — not the property owner
- `404 Not Found` — cohost record not found

---

### 4.5 `GET /cohosts/my-invites`

Get all pending invitations sent to the current user.

**Access:** Any authenticated user

**Success 200:**
```json
[
  {
    "id": 3,
    "propertyId": 42,
    "hostId": 17,
    "cohostId": 5,
    "role": "cleaner",
    "status": "pending",
    "property": {
      "id": 42,
      "title": "Nile View Studio",
      "uuid": "abc-123-def"
    },
    "host": {
      "id": 17,
      "firstName": "Ahmed",
      "lastName": "Nour"
    },
    "createdAt": "2026-03-25T09:00:00.000Z"
  }
]
```

---

### 4.6 `PATCH /properties/:propertyId/cohosts/:cohostId/reinvite`

Re-invite a user who previously declined. **(B4)**

**Access:** Property owner only

**What it does:**
- Finds the `declined` record for `(propertyId, cohostId)`
- Resets `status` to `pending`
- Re-sends the in-app `cohost_invite` notification and invite email (non-fatal)

**Success 200:** Returns the updated `CoHost` object

**Error cases:**
- `403 Forbidden` — caller is not the property owner
- `404 Not Found` — no cohost record found for `(propertyId, cohostId)`
- `400 Bad Request` — record exists but status is not `declined`

---

### 4.7 `GET /cohosts/my-properties`

Get all properties where the current user is an **accepted** co-host or cleaner. **(B5)**

**Access:** Any authenticated user

**Success 200:**
```json
[
  {
    "id": 3,
    "propertyId": 42,
    "hostId": 17,
    "cohostId": 5,
    "role": "co_host",
    "status": "accepted",
    "property": {
      "id": 42,
      "title": "Nile View Studio",
      "uuid": "abc-123-def",
      "images": []
    },
    "host": {
      "id": 17,
      "firstName": "Ahmed",
      "lastName": "Nour"
    },
    "createdAt": "2026-03-20T10:00:00.000Z"
  }
]
```

---

## 5. Frontend API Wrapper

**File:** `packages/web/src/lib/api.ts`

```typescript
export const cohostsApi = {
  // B8: paginated — returns { items, total, page, limit }
  getCohosts: (propertyId: number, page = 1, limit = 50) =>
    apiClient
      .get<{ items: CoHost[]; total: number; page: number; limit: number }>(
        `/properties/${propertyId}/cohosts`,
        { params: { page, limit } },
      )
      .then((r) => r.data),

  // Invite someone (owner only) — needs: { email, role? }
  invite: (propertyId: number, payload: InviteCohostPayload) =>
    apiClient.post<CoHost>(`/properties/${propertyId}/cohosts`, payload).then((r) => r.data),

  // B7: cohostId in URL is now validated against the current user's ID server-side
  respond: (propertyId: number, cohostId: number, response: 'accepted' | 'declined') =>
    apiClient
      .patch<CoHost>(`/properties/${propertyId}/cohosts/${cohostId}/respond`, { response })
      .then((r) => r.data),

  // F3 fixed: passes c.cohostId (user FK), not c.id (record PK)
  remove: (propertyId: number, cohostId: number) =>
    apiClient.delete(`/properties/${propertyId}/cohosts/${cohostId}`).then((r) => r.data),

  // B4: reset a declined invite to pending and re-notify
  reinvite: (propertyId: number, cohostId: number) =>
    apiClient
      .patch<CoHost>(`/properties/${propertyId}/cohosts/${cohostId}/reinvite`)
      .then((r) => r.data),

  // B9: returns pending invites with property.images + host relations
  getMyInvites: () =>
    apiClient.get<CoHost[]>('/cohosts/my-invites').then((r) => r.data),

  // B5: properties where the current user is an accepted co-host/cleaner
  getMyProperties: () =>
    apiClient.get<CoHost[]>('/cohosts/my-properties').then((r) => r.data),
};
```

---

## 6. What Is Already Built

### ✅ Backend (fully working)
- `CoHostEntity` — TypeORM entity with all fields
- `CohostsService` — 7 methods: `getCohosts` (paginated), `inviteCohost`, `respondToInvite`, `removeCohost`, `reinviteCohost`, `getMyInvites`, `getMyProperties`
- `CohostsController` — routes: `GET /`, `POST /`, `PATCH /:cohostId/respond`, `PATCH /:cohostId/reinvite`, `DELETE /:cohostId`
- `CohostInvitesController` — routes: `GET /cohosts/my-invites`, `GET /cohosts/my-properties`
- `CoHostGuard` — checks owner or accepted co-host; supports `@RequireCoHostRole()` for role-level restriction
- `RequireCoHostRole` decorator — `packages/backend/src/cohosts/decorators/require-cohost-role.decorator.ts`
- `CohostsModule` — registered in `app.module.ts`; imports `ConfigModule` + `NotificationsModule`
- Database table `cohosts` with schema + unique constraint
- DTOs: `InviteCohostDto`, `RespondCohostDto`
- Notifications: `cohost_invite` emitted on invite + re-invite; `cleaning_scheduled` emitted to accepted cleaners on booking confirm
- Email: `tplCohostInvite()` template in `mail.service.ts`; sent on invite and re-invite (non-fatal)

### ✅ Frontend Web
- Co-hosts management page at `/hosting/listings/[uuid]/cohosts`
  - Paginated list with role + status badges
  - Invite form (email + role selector) — owner only
  - Remove button passes `c.cohostId` (user FK) ✅ bug fixed
  - Re-invite button (`RotateCcw`) for declined co-hosts
- Invitations page at `/account/invites`
  - Shows pending invitations with property image, host details, role badge
  - Accept / Decline buttons call `cohostsApi.respond()`
- "Properties I Co-host" section on `/hosting` dashboard (via `cohostsApi.getMyProperties()`)
- Co-hosts `ActionBtn` (violet, Users icon) on `ListingCard` → `/hosting/listings/${uuid}/cohosts`
- Notification routing: `cohost_invite` → `/account/invites`, `cleaning_scheduled` → `/hosting`
- `cohostsApi` in `lib/api.ts` — 7 methods: `getCohosts`, `invite`, `respond`, `remove`, `reinvite`, `getMyInvites`, `getMyProperties`
- `CoHost`, `CohostRole`, `CohostStatus` TypeScript types

### ❌ Mobile App
- **Zero** cohost/cleaner support. No pages, no API calls, nothing.

---

## 7. Missing APIs / Gaps — ✅ ALL RESOLVED

> **All B1–B9 backend gaps and F1–F6 frontend gaps have been implemented as of 2026-03-28.**

### Backend — Resolved

| # | Gap | Status | Fix Applied |
|---|-----|--------|-------------|
| B1 | **No notification on invite** | ✅ Fixed | `inviteCohost()` calls `notificationsService.create('cohost_invite')` after save |
| B2 | **No email on invite** | ✅ Fixed | `tplCohostInvite()` template added to `mail.service.ts`; called in `inviteCohost()` and `reinviteCohost()` |
| B3 | **`CoHostGuard` ignores `role`** | ✅ Fixed | `Reflector` injected into guard; `@RequireCoHostRole()` decorator at `cohosts/decorators/require-cohost-role.decorator.ts` |
| B4 | **No re-invite API** | ✅ Fixed | `PATCH /properties/:propertyId/cohosts/:cohostId/reinvite` added; resets to `pending` and re-notifies |
| B5 | **No "my cohost properties" endpoint** | ✅ Fixed | `GET /cohosts/my-properties` returns accepted co-host records with `property`, `property.images`, `host` |
| B6 | **Cleaner has no actual functionality** | ✅ Fixed | `bookings.service.ts confirm()` now notifies all accepted cleaners with `cleaning_scheduled` notification |
| B7 | **`:cohostId` URL param unused in respond** | ✅ Fixed | Controller validates `cohostId === user.id` and throws `ForbiddenException` |
| B8 | **No pagination on `getCohosts`** | ✅ Fixed | `page` + `limit` query params added; returns `{ items, total, page, limit }` |
| B9 | **`getMyInvites` missing `cohost` relation** | ✅ Fixed | `property.images` added to relations; response consistent with getCohosts |

### Frontend — Resolved

| # | Gap | Status | Fix Applied |
|---|-----|--------|-------------|
| F1 | **No "My Invitations" page** | ✅ Fixed | New page at `app/[locale]/account/invites/page.tsx` |
| F2 | **No respond UI anywhere** | ✅ Fixed | Accept / Decline buttons on invites page call `cohostsApi.respond()` |
| F3 | **Remove uses wrong ID** | ✅ Fixed | `removeMutation.mutate(c.id)` → `removeMutation.mutate(c.cohostId)` |
| F4 | **No notification click handler for `cohost_invite`** | ✅ Fixed | `getNotifRoute()` maps `cohost_invite` → `/account/invites`, `cleaning_scheduled` → `/hosting` |
| F5 | **Co-host cannot access hosting tools** | ✅ Fixed | "Properties I Co-host" section on hosting dashboard using `cohostsApi.getMyProperties()` |
| F6 | **No cohost count/badge on listing card** | ✅ Fixed | Co-hosts `ActionBtn` (violet, Users icon) linking to `/hosting/listings/${uuid}/cohosts` added to `ListingCard.tsx` |

### Bonus improvements (not in original gaps list)
- ✅ **Paginated response handled in `cohosts/page.tsx`**: `getCohosts` returns `{ items, total, page, limit }` — page correctly extracts `items`
- ✅ **Re-invite button in `cohosts/page.tsx`**: Declined co-hosts show a `RotateCcw` button calling `cohostsApi.reinvite()`

### Mobile Missing

| # | Gap | Description |
|---|-----|-------------|
| M1 | **No co-host or cleaner UI on mobile at all** | Every part of the feature needs to be built from scratch for mobile. |

---

## 8. Bugs Found — ✅ ALL FIXED

### Bug 1: `remove` passes record ID not user ID — ✅ Fixed

**File:** `packages/web/src/app/[locale]/hosting/listings/[id]/cohosts/page.tsx`

```typescript
// ❌ WAS (wrong):
removeMutation.mutate(c.id)   // c.id = cohosts.id (primary key, e.g. row #3)

// ✅ SHOULD BE:
removeMutation.mutate(c.cohostId)   // cohostId = users.id of the invited person
```

**Fix:**
```typescript
// In page.tsx → remove button onClick:
onClick={() => removeMutation.mutate(c.cohostId)}
```

**Why it fails:** The backend service runs:
```typescript
this.cohostsRepo.findOne({ where: { propertyId, cohostId } })
// cohostId column is users.id (foreign key) — NOT the cohosts.id primary key
```
So if record #3 has `cohost_id = 25`, sending `3` will search for a user with ID 3, which may be a different person or not found at all.

---

### Bug 2: `respond` `:cohostId` URL param — ✅ Fixed (B7)

**File:** `packages/backend/src/cohosts/cohosts.controller.ts`

**Fix applied (Option B — validation):**
```typescript
@Patch(':cohostId/respond')
respond(
  @Param('cohostId', ParseIntPipe) cohostId: number,
  @CurrentUser() user: UserEntity,
  @Body() dto: RespondCohostDto,
) {
  if (cohostId !== user.id) {
    throw new ForbiddenException('You can only respond to your own invitations');
  }
  return this.cohostsService.respondToInvite(propertyId, user.id, dto);
}
```

The `:cohostId` URL param is now validated against the authenticated user's ID. Attempting to respond on behalf of another user returns `403 Forbidden`.

---

## 9. Role Permissions Matrix

What **should** each role be able to do vs. what is **currently enforced**:

| Action | Owner | Co-host | Cleaner | Currently Enforced? |
|--------|-------|---------|---------|---------------------|
| View cohost list | ✅ | ✅ | ✅ | ✅ (GuCohostGuard) |
| Invite co-host/cleaner | ✅ | ❌ | ❌ | ✅ (service check) |
| Remove co-host | ✅ | ❌ | ❌ | ✅ (service check, bug F3 fixed) |
| Respond to invite | — | ✅ (self) | ✅ (self) | ✅ (service uses user.id) |
| Edit listing | ✅ | ✅ | ❌ | ❌ **NOT enforced** |
| Approve/decline bookings | ✅ | ✅ | ❌ | ❌ **NOT enforced** |
| Reply to guest messages | ✅ | ✅ | ❌ | ❌ **NOT enforced** |
| View calendar | ✅ | ✅ | ✅ | ❌ **NOT enforced** |
| Receive cleaning notifications | — | ❌ | ✅ | ✅ (`cleaning_scheduled` notification via B6) |
| View listing as co-host on dashboard | — | ✅ | ✅ | ✅ ("Properties I Co-host" on `/hosting` via F5) |

---

## 10. Completed Work — All Done

> **All critical, medium, and non-mobile low-priority items are complete as of 2026-03-28.**

### ✅ Critical — Done

| Item | Tag | File(s) Changed |
|------|-----|-----------------|
| Fix Bug F3: Remove passes wrong ID | F3 | `cohosts/page.tsx` — `removeMutation.mutate(c.cohostId)` |
| Build: "My Invitations" page | F1 | `app/[locale]/account/invites/page.tsx` (new file) |
| Build: Accept / Decline UI | F2 | Same page — calls `cohostsApi.respond()` |
| Build: In-app notification on invite | B1 | `cohosts.service.ts` + `cohosts.module.ts` (NotificationsModule imported) |
| Build: Email on invite | B2 | `mail.service.ts` (`tplCohostInvite()`) called in `inviteCohost()` |
| Build: Notification click → invites page | F4 | `notifications/page.tsx` — `cohost_invite` → `/account/invites` |

### ✅ Medium Priority — Done

| Item | Tag | File(s) Changed |
|------|-----|-----------------|
| Backend: Role-based CoHostGuard | B3 | `cohost.guard.ts` + `require-cohost-role.decorator.ts` (new file) |
| Backend: Re-invite API | B4 | `cohosts.controller.ts` + `cohosts.service.ts` (`reinviteCohost()`) |
| Backend: Cleaner `cleaning_scheduled` notifications | B6 | `bookings.service.ts` + `bookings.module.ts` (CoHostEntity added) |
| Backend: "My co-host properties" endpoint | B5 | `cohosts.controller.ts` + `cohosts.service.ts` (`getMyProperties()`) |
| Frontend: Co-host dashboard view | F5 | `hosting/page.tsx` — "Properties I Co-host" section |

### ✅ Low Priority — Done

| Item | Tag | File(s) Changed |
|------|-----|-----------------|
| Fix: `respond` URL param validation | B7 | `cohosts.controller.ts` — `cohostId !== user.id → ForbiddenException` |
| Add: Co-hosts ActionBtn on listing cards | F6 | `ListingCard.tsx` — violet Co-hosts button linking to cohosts page |
| Add: Re-invite button for declined co-hosts | bonus | `cohosts/page.tsx` — `RotateCcw` button + `reinviteMutation` |
| Paginated `getCohosts` | B8 | `cohosts.controller.ts`, `cohosts.service.ts`, `api.ts` |
| `getMyInvites` with `property.images` relation | B9 | `cohosts.service.ts` |

### ❌ Still Missing — Mobile Only

| Item | Description |
|------|-------------|
| M1: Full mobile co-host support | Every part of the feature needs to be built from scratch for the mobile app (out of scope for web) |

---

## Appendix A: File Locations

| File | Purpose |
|------|---------|
| `packages/backend/src/cohosts/cohosts.controller.ts` | All routes |
| `packages/backend/src/cohosts/cohosts.service.ts` | Business logic |
| `packages/backend/src/cohosts/cohosts.module.ts` | NestJS module |
| `packages/backend/src/cohosts/dto/invite-cohost.dto.ts` | Invite DTO |
| `packages/backend/src/cohosts/dto/respond-cohost.dto.ts` | Respond DTO |
| `packages/backend/src/cohosts/decorators/require-cohost-role.decorator.ts` | Role decorator (B3) |
| `packages/backend/src/entities/cohost.entity.ts` | TypeORM entity |
| `packages/backend/src/common/guards/cohost.guard.ts` | Access guard (with role check) |
| `packages/backend/src/bookings/bookings.service.ts` | Cleaner notifications on booking confirm (B6) |
| `packages/web/src/app/[locale]/hosting/listings/[id]/cohosts/page.tsx` | Host management UI |
| `packages/web/src/app/[locale]/account/invites/page.tsx` | Invitee's invitations page (F1+F2) |
| `packages/web/src/lib/api.ts` — `cohostsApi` | Frontend API wrapper (7 methods) |
| `packages/web/src/types/index.ts` — `CoHost` | TypeScript types |
| `packages/shared/src/index.ts` — `CoHostRole`, `CoHostStatus` | Shared types |
| `database/schema.sql` — `cohosts` table | SQL schema |
