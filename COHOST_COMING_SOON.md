# Co-host Feature — Coming Soon Status

> Last updated: 2025-01-01
> Status: **ALL CO-HOST TOUCHPOINTS MARKED AS COMING SOON** ✅

---

## Summary

The co-host & team management feature is not yet production-ready.
All user-facing entry points have been replaced with a **Coming Soon** screen
so that users are informed gracefully rather than hitting broken functionality.

---

## Touchpoints Replaced / Disabled

### 1. Pages (replaced with Coming Soon screen)

| File | Route | Icon used |
|------|-------|-----------|
| `packages/web/src/app/[locale]/hosting/cohosts/page.tsx` | `/hosting/cohosts` | `Users` |
| `packages/web/src/app/[locale]/hosting/available-hosts/page.tsx` | `/hosting/available-hosts` | `UserSearch` |
| `packages/web/src/app/[locale]/account/invites/page.tsx` | `/account/invites` | `MailOpen` |
| `packages/web/src/app/[locale]/hosting/listings/[id]/cohosts/page.tsx` | `/hosting/listings/:id/cohosts` | `UserCheck` |

All four pages now render an identical Coming Soon card with:
- Icon + "Coming Soon" amber badge
- Title: *"Co-host & Team Management"*
- Description explaining what the feature will do
- "← Back to Dashboard" link

---

### 2. Hosting dashboard quick actions (entries removed)

File: `packages/web/src/app/[locale]/hosting/page.tsx`

Removed from the quick-action list:
- ~~👥 My Co-host Team~~ → `/hosting/cohosts`
- ~~🔍 Find Co-hosts~~ → `/hosting/available-hosts`

Also removed:
- `cohostsApi` import
- `cohostProperties` query
- "Properties I Co-host" section at the bottom of the dashboard

---

### 3. Listing card action strip (button removed)

File: `packages/web/src/components/hosting/ListingCard.tsx`

Removed:
- ~~Team button~~ (`UserCheck` icon → `/hosting/listings/:uuid/cohosts`)

Action strip reduced from `grid-cols-5` to `grid-cols-4`:
Edit | Preview | Calendar | Archive

---

### 4. Notification routing (redirected to /hosting)

File: `packages/web/src/app/[locale]/notifications/page.tsx`

Changed:
- `cohost_invite` → now routes to `/hosting` (previously `/account/invites`)
- `cleaning_scheduled` → now routes to `/hosting` (previously `/account/invites` or `/hosting`)

---

## Backend Notes

The backend (`packages/backend/src/cohosts/`) still exists with full functionality.
The API endpoints are **not** disabled — they're simply unreachable via the web UI.
This allows the feature to be silently enabled by reverting the frontend changes
without any backend work.

---

## How to Re-enable

1. Restore the 4 page files from Git history
2. Re-add "My Co-host Team" and "Find Co-hosts" to quick actions in `hosting/page.tsx`
3. Re-add the `cohostsApi` import and `cohostProperties` query in `hosting/page.tsx`
4. Re-add the Team `ActionBtn` in `ListingCard.tsx` (restore `grid-cols-5`)
5. Restore notification routes for `cohost_invite` and `cleaning_scheduled`

---

## Checklist

- [x] `/hosting/cohosts` → Coming Soon
- [x] `/hosting/available-hosts` → Coming Soon
- [x] `/account/invites` → Coming Soon
- [x] `/hosting/listings/[id]/cohosts` → Coming Soon
- [x] Dashboard quick actions: "My Co-host Team" removed
- [x] Dashboard quick actions: "Find Co-hosts" removed
- [x] Dashboard "Properties I Co-host" section removed
- [x] `ListingCard.tsx` "Team" button removed
- [x] Notification routing: `cohost_invite` → `/hosting`
- [x] Notification routing: `cleaning_scheduled` → `/hosting`
