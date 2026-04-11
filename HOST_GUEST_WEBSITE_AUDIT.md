# Oikivo Website Audit — Hosts And Guests

> Status date: April 11, 2026
> Scope: Website experience in `packages/web`
> Goal: Summarize what is already available for guests and hosts, what is still missing or incomplete, and the current consultant decision.

---

## Executive Summary

The website is currently the strongest Oikivo surface for both guest and host flows.

Current practical position:
- Guest web flows are broadly available and more complete than mobile.
- Host tooling is primarily web-first and should remain that way for now.
- Consultant-related website flows should be treated as coming soon for now.

---

## Guest Features

### Available Now
- Registration and login
- Forgot password and reset password
- Search and property browsing
- Property detail pages
- Booking flows
- Trips and booking review flows
- Inbox and notifications surfaces
- Wishlists
- Account settings and profile updates
- Email verification and account verification entry points
- Legal and policy pages

### Missing Or Incomplete For Guests
- Full end-to-end payment confidence and recovery states need audit coverage
- Saved search lifecycle needs explicit product parity review
- Real-time messaging quality should be validated against polling and delivery expectations
- Push notifications are not a website-native strength and should rely on broader notification strategy
- Guest dispute visibility and self-service tracking need a focused UX audit
- Deep linking between booking, support, and trust flows needs consistency review
- Full guest accessibility and localization parity still need structured QA coverage

### Guest Assessment
- The guest website is usable for core booking and account journeys.
- The remaining work is mostly around polish, trust tooling, support clarity, and parity validation.

---

## Host Features

### Available Now
- Host dashboard entry points
- Listing management surfaces
- Hosting calendar and availability management
- Hosting performance and operations entry points
- Account-level host settings
- Co-host and hosting-related placeholders in some areas
- Web-first host workflow access from account and hosting sections

### Missing Or Incomplete For Hosts
- Some host sub-surfaces still appear to be placeholder or coming-soon implementations
- Co-hosting and invite collaboration need completion and hardening
- Advanced analytics and operations parity still need structured validation
- Earnings, payout clarity, and payout self-service should be audited end to end
- Host workflow QA for regulations, edge cases, and recovery states remains incomplete
- Cross-surface consistency between hosting dashboard, listings, calendar, and account sections needs cleanup

### Host Assessment
- Hosting is correctly positioned as web-first.
- The website should remain the source of truth for host operations until mobile host tooling is intentionally built out.

---

## Consultant Status

Consultant-related functionality should not be considered live on the website right now.

Current rule:
- Anything related to consultants or consultations on the website should show a coming-soon state.
- Public users should not see active consultant marketplace, profile, booking, or consultant self-service flows for now.

Consultant items that should remain coming soon:
- Consultations landing page
- Consultant profile pages
- Consultant booking pages
- Consultant dashboard
- Consultant profile management
- Consultant services management
- Consultant availability management
- Become-a-consultant flow
- My consultation bookings

Recommended message:
- "Consultations are coming soon on the Oikivo website."

---

## Priority Missing Items

### Highest Priority For Guests
1. Audit payment completion and failure recovery UX
2. Validate dispute and support self-service coverage
3. Verify trust and verification journey clarity
4. Close localization and accessibility gaps in core flows

### Highest Priority For Hosts
1. Keep host management web-first
2. Identify and replace remaining placeholder host surfaces deliberately
3. Audit payouts, analytics, and collaboration flows end to end
4. Remove inconsistent navigation between host sections

### Highest Priority For Consultants
1. Keep all consultant surfaces in coming-soon state
2. Avoid exposing partial consultant flows before release readiness
3. Reintroduce consultant features only after a dedicated launch audit

---

## Current Product Position

If the website is presented today, the safest description is:
- Guest website: usable and relatively mature
- Host website: primary management surface
- Consultant website: coming soon