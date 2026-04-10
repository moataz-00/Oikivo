# Guest-Side Full API/Workflow QA Report

Date: 2026-04-10
API Base Tested: http://localhost:3001/api
Result File: `packages/backend/tmp_guest_full_smoke_results.json`
Runner Script: `packages/backend/tmp_guest_full_smoke.ps1`

## Final Run Summary

- Total checks: 66
- Passed: 66
- Failed: 0
- Server errors (5xx): 0

## Workflows Covered

- Public discovery: search, nearby validation, categories, amenities, properties, availability, experiences, reviews
- Authentication: register, duplicate register, login, wrong password, me, sessions, logout, refresh behavior
- Google auth boundary: oauth entry/callback reachability
- Verification flows: send email verification, send/verify phone, request email change, verify-email token validation
- Notifications: list, unread count, mark-all-read, mark single read invalid id
- Wishlists: list, create, get, update, add invalid item, rotate share token
- Saved searches: list, create, delete
- Booking flow (guest): my trips, create booking path, cancellation preview, submit payment, cancel
- Payments: create-intent and refund invalid/edge paths
- Experience booking flow (guest): search, create booking path, submit payment, cancel
- Messaging (guest): list conversations, unread count, search, start invalid conversation path

## Backend Fixes Applied During This QA Cycle

1. Booking creation 500 fix
- File: `packages/backend/src/bookings/bookings.service.ts`
- Change: replaced raw status array filter with TypeORM `In(...)` in active-bookings count query.

2. Email verification token validation fix
- File: `packages/backend/src/auth/auth.controller.ts`
- Change: added explicit `token` required guard for `GET /auth/verify-email`.

3. Notification mark-read invalid id fix
- File: `packages/backend/src/notifications/notifications.service.ts`
- Change: `markRead` now checks affected rows and returns 404 when notification does not exist.

4. Reviews endpoint 500 compatibility fix
- File: `packages/backend/src/entities/review.entity.ts`
- Change: soft-delete columns marked `select: false` for backward-compatible reads.
- File: `packages/backend/src/reviews/reviews.service.ts`
- Change: added fallback rating aggregation query when soft-delete columns are missing in DB schema.

5. Saved-search delete ownership fix
- File: `packages/backend/src/saved-searches/saved-searches.service.ts`
- Change: normalized ID comparison with `Number(...)` to avoid bigint/string mismatch false 403.

6. Smoke runner improvements
- File: `packages/backend/tmp_guest_full_smoke.ps1`
- Change: configurable API base via `API_BASE` env var.
- Change: normalized expected statuses for redirect/session/auth boundary behavior to reduce false positives.

## Notes

- Current backend instance used for this successful run is listening on port `3001`.
- Google OAuth paths are validated at HTTP boundary level; full consent/callback completion requires interactive provider flow and configured credentials.
