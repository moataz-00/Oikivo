# Oikivo Mobile Audit — Host And Guest Missing Features

> Status date: April 11, 2026
> Scope: Current mobile app only
> Goal: Identify what is available now, what is missing for guests and hosts, and clarify consultant status.

---

## Executive Summary

The mobile app covers the main guest browsing flow and part of the booking flow, but it is still behind the website for both guest and host capabilities.

Current practical status:
- Guest core browsing is available.
- Basic stay booking flow exists.
- Wishlists, reviews, trips, inbox, and profile are available.
- Host management is intentionally redirected to the website.
- Consultant-related features should be treated as website-only and coming soon.

---

## Guest Features

### Available Now
- Authentication: login and register
- Explore home feed
- Search screen with basic filters
- Property detail page
- Booking initiation flow
- Trips screen
- Wishlists
- Reviews submission
- Inbox and chat UI
- Profile and notifications screens

### Missing Or Incomplete For Guests
- Forgot password and reset password
- Email verification flow
- Phone verification flow
- ID verification and document upload
- Full payment completion flow
- Saved searches
- Advanced search filters parity with website
- Map search experience
- Dispute filing and dispute tracking
- Legal/policy pages inside mobile
- Real-time messaging instead of polling
- Push notification registration and handling
- Offline support and cache persistence
- Deep link routing coverage

### Guest Impact
- Users can browse and start core flows, but several important trust, payment, and support features still require the website.

---

## Host Features

### Available Now
- Host entry points exist in mobile profile.
- Host actions are redirected to the website intentionally.

### Missing Or Website-Only For Hosts
- Host dashboard
- Listing creation and management
- Reservations management
- Availability and calendar tools
- Earnings dashboard
- Payout requests and payout settings
- Co-hosts and team management
- Listing analytics
- Pricing rules and seasonal pricing
- Listing media upload and advanced editing
- Regulations and advanced host operations

### Host Product Decision
- For now, host-side product management should happen on the website only.
- Mobile should not be treated as a host management app yet.

---

## Consultant Status

Consultant-related features are not active in mobile at this time.

Current rule:
- Anything related to consultants should be presented as coming soon on the website.
- Mobile should not expose active consultant booking or consultant management flows for now.

Consultant items currently considered website-only:
- Consultant directory
- Consultant profile pages
- Consultation booking
- My consultation bookings
- Become a consultant flow
- Consultant management tools

Recommended product message:
- "Consultations are coming soon on the Oikivo website."

---

## Priority Missing Items

### Highest Priority For Guests
1. Payment completion flow
2. Forgot password
3. Email and phone verification
4. ID verification
5. Dispute/support workflow
6. Push notifications

### Highest Priority For Hosts
1. Keep host management web-only until a full mobile host product is planned
2. Remove or redirect any unfinished host management surfaces to website
3. Add a clear website handoff message everywhere host actions appear

### Highest Priority For Consultants
1. Keep all consultant features in coming-soon state
2. Redirect users to website information page only
3. Do not enable partial consultant flows in mobile until full release is ready

---

## Recommended Current Messaging

### For Host Actions
- "Hosting tools are available on the Oikivo website for the best experience."

### For Consultant Actions
- "Consultations are coming soon on the Oikivo website."

### For Guest Missing Features
- "Some account verification, payment, and support tools are currently available on the Oikivo website."

---

## Current Product Position

If you present the mobile app today, the safest description is:
- Guest app: partially ready
- Host app: website-only for management
- Consultant app: not launched on mobile, coming soon on website
