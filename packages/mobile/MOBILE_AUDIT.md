# Oikivo Mobile App — Audit Report

> **Generated for:** Mobile app alignment with Web app  
> **Platform:** Expo SDK 54 · React Native 0.81 · React 19

---

## 1. Executive Summary

The mobile app is approximately **40% feature-complete** compared to the web app. Core guest browsing and basic booking work, but there are major gaps in payments, host tools, monetization, and advanced features. Consultant-related functionality should currently be treated as **coming soon on the website**, not active in mobile.

---

## 2. Branding & Theme (✅ Fixed)

| Item | Before | After |
|------|--------|-------|
| App name | Sakan | **Oikivo** |
| Brand color | `#FF385C` (pink-red) | **`#4F46E5` (indigo)** |
| Brand dark | `#E31C5F` | **`#4338CA`** |
| Brand light | — | **`#6366F1`** |
| Bundle ID | `app.sakan.mobile` | **`app.oikivo.mobile`** |
| Splash screen | Plain + ActivityIndicator | **Animated gradient + reanimated** |
| Animations | None | **FadeIn, StaggerContainer, SlideIn, ScaleIn utilities** |

---

## 3. Page / Screen Comparison

### Web Pages (58+)
| Category | Pages |
|----------|-------|
| Auth & Account | Login, Register, Forgot Password, Reset Password, Email Verify, Phone Verify, ID Verify |
| Guest | Home, Search (advanced filters), Property Detail, Trips, Booking Checkout, Dispute Filing |
| Host Dashboard | Listings, Create/Edit Listing, Calendar, Reservations, Analytics, Earnings, Co-hosts, Team, Regulations |
| Consultations | Directory, Consultant Profile, Book Consultation, My Consultations, Availability, Manage |
| Messaging | Inbox, Conversation Thread |
| Wishlists | List, Detail |
| Notifications | Full notification center |
| Legal | Terms, Privacy, Cancellation Policy, Host Guidelines, Community Standards, About |

### Mobile Screens (14)
| Category | Screens |
|----------|---------|
| Auth | Login, Register |
| Tabs | Home, Trips, Inbox, Wishlists, Profile |
| Property | Search, Room Detail, Public Profile |
| Booking | Checkout (`booking/[propertyId]`) |
| Hosting | Dashboard, Listings, Create, Edit, Calendar, Reservations |

### ❌ Missing from Mobile
- Forgot Password / Reset Password
- Email & Phone Verification
- ID Verification / Document Upload
- Advanced Search (price range, dates, amenities, map view)
- Dispute Filing & Management
- Consultations Marketplace in mobile is disabled for now and treated as coming soon on website
- Experiences (coming soon on web, absent on mobile)
- Host Analytics & Earnings pages
- Host Co-hosts / Team Management
- Payout Management
- Notification Center (dedicated screen)
- Legal / Policy pages
- Account Settings (personal info editing, avatar upload)

---

## 4. Backend API Coverage

The backend exposes **~150+ endpoints** across 21 controllers. Mobile uses approximately **30%** of them.

### ✅ Used by Mobile
- `POST /auth/login` · `POST /auth/register` · `POST /auth/logout`
- `GET /users/me` · `PATCH /users/become-host`
- `GET /search` · `GET /properties/:id`
- `GET /categories` · `GET /amenities`
- `POST /bookings` · `GET /bookings` · `PATCH /bookings/:id/confirm|decline|cancel`
- `POST /reviews` · `GET /reviews`
- `GET /wishlists` · `POST /wishlists` · `DELETE /wishlists/:id`
- `GET /messages/conversations` · `GET /messages/:conversationId` · `POST /messages`

### ⚠️ Exist on Backend but NOT Used by Mobile

| Controller | Endpoints | Notes |
|------------|-----------|-------|
| **Payments** | `POST /payments/create-intent`, `/confirm`, `/opay`, `/instapay` | No payment UI at all |
| **Payouts** | `GET /payouts`, `POST /payouts/request`, `GET /payouts/balance` | Host earnings invisible |
| **Disputes** | Full CRUD + file evidence upload | Entire system missing |
| **Consultations** | 15+ endpoints (CRUD, availability, booking, reviews) | Entire marketplace missing |
| **Experiences** | Full CRUD + booking | Not implemented |
| **Uploads** | `POST /uploads/avatar`, `/id-document`, `/property-photos`, `/message-image` | No image upload flows |
| **Users** | `PATCH /users/profile`, `POST /users/verify-email`, `/verify-phone`, `/verify-id` | Profile editing missing |
| **Availability** | `GET /availability/:propertyId`, `PUT /availability/block-dates`, seasonal pricing | Calendar read-only |
| **Co-hosts** | Full CRUD + permissions | Not implemented |
| **Notifications** | `GET /notifications`, `PATCH /notifications/read`, push registration | No notification screen |
| **Saved Searches** | Full CRUD | Not implemented |
| **Admin** | 21+ admin endpoints | Not applicable to mobile |
| **Scheduler** | Cron jobs for reminders, auto-checkout | Backend-only |
| **Audit Log** | Admin logging | Backend-only |

---

## 5. Critical Workflow Gaps

### 5.1 Payment Flow 🔴
- **Web:** Full Stripe checkout modal + OPay + Instapay bank transfer
- **Mobile:** Can create a booking but **cannot pay**. No payment UI, no Stripe integration, no OPay.
- **Impact:** Bookings are created but never completed.

### 5.2 Identity Verification 🔴
- **Web:** Multi-step ID upload, email verify, phone verify with OTP
- **Mobile:** None. Profile shows user info but no way to verify identity.
- **Impact:** Hosts who require verified guests cannot be booked.

### 5.3 Dispute Resolution 🔴
- **Web:** File dispute, upload evidence, track status, respond
- **Mobile:** No dispute screens at all.
- **Impact:** Guests/hosts must use web for any issues.

### 5.4 Host Earnings & Payouts 🔴
- **Web:** Earnings dashboard, payout requests, payout history, bank account setup
- **Mobile:** Dashboard shows basic stats but no earnings or payout functionality.

### 5.5 Advanced Search 🟡
- **Web:** Price range slider, date picker, guest count, amenity filters, property type, map view, sorting
- **Mobile:** Only category filter. SearchBar navigates to a search screen but only has text search.

### 5.6 Profile Management 🟡
- **Web:** Full profile editing, avatar upload, bio, languages, emergency contact
- **Mobile:** Profile is read-only. Settings rows show alerts instead of actual screens.

### 5.7 Messaging 🟡
- **Web:** Text + image messages, real-time with WebSocket
- **Mobile:** Text only, no image send. No WebSocket — polling only.

### 5.8 Listing Management 🟡
- **Web:** Photo upload/reorder, amenity picker, pricing rules, seasonal pricing, cleaning fees
- **Mobile:** Basic create/edit form. No photo management, limited amenity selection.

---

## 6. UI Component Gaps

| Web Component | Mobile Equivalent | Status |
|---------------|-------------------|--------|
| `PaymentModal` (Stripe) | — | ❌ Missing |
| `OPayCheckout` | — | ❌ Missing |
| `MapView` (Leaflet) | — | ❌ Missing |
| `DateRangePicker` | — | ❌ Missing |
| `PriceRangeSlider` | — | ❌ Missing |
| `ImageUploader` | — | ❌ Missing |
| `NotificationBell` | — | ❌ Missing |
| `ConsultantCard` | — | ❌ Missing |
| `DisputeForm` | — | ❌ Missing |
| `AnalyticsChart` | — | ❌ Missing |
| `EarningsSummary` | — | ❌ Missing |
| `CalendarAvailability` | Basic calendar | ⚠️ Partial |
| `FilterBar` | Category chips | ⚠️ Partial |
| `ReviewForm` | — | ❌ Missing |
| Motion / animation wrappers | `Animated.tsx` utilities | ✅ Added |

---

## 7. Known Issues & Errors

### 7.1 React 18 / 19 Conflict ⚠️
- Root `node_modules` has React 18 (for web/admin). Mobile needs React 19.
- **Fix applied:** Custom `metro.config.js` with hardcoded `resolveRequest` for React 19.
- **Risk:** May break if npm re-hoists dependencies.

### 7.2 react-native-screens Version Mismatch ⚠️
- Installed: `~4.11.0`. Expo SDK 54 expects: `~4.16.0`.
- **Impact:** May cause navigation issues on some devices.
- **Fix:** Run `npx expo install react-native-screens` to update.

### 7.3 Node.js Version ⚠️
- Current: `v20.18.2`. Metro requires: `>=20.19.4`.
- **Impact:** Warning only, Metro still starts. May cause edge-case issues.

### 7.4 Settings Screens Are Stubs
- "Personal information", "Notifications", "Privacy and sharing" all show `Alert.alert()` instead of navigating to actual screens.

### 7.5 No Error Boundaries
- App has no `ErrorBoundary` component. Unhandled errors crash the app.

### 7.6 No Offline Support
- No caching strategy. App is unusable without internet.

### 7.7 No Deep Linking Configuration
- `scheme: "oikivo"` is set but no route mapping for deep links.

### 7.8 No Push Notifications
- Backend supports push notification registration but mobile doesn't use `expo-notifications`.

---

## 8. Priority Roadmap

### P0 — Critical (Blocks Core Usage)
1. **Payment UI** — Implement Stripe checkout + OPay for booking completion
2. **Email/Phone Verification** — OTP flows for account verification
3. **Error Boundaries** — Wrap app in ErrorBoundary to prevent crashes

### P1 — High (Core Feature Parity)
4. **Advanced Search Filters** — Price range, dates, guest count, amenities
5. **Profile Editing** — Avatar upload, bio, personal info forms
6. **Dispute System** — File, track, respond to disputes
7. **Host Earnings & Payouts** — Earnings dashboard + payout requests
8. **Image Upload in Messages** — Use backend's message-image endpoint
9. **Push Notifications** — Setup `expo-notifications` + backend registration

### P2 — Medium (Feature Expansion)
10. **Consultations Marketplace** — Keep as website-only coming soon until mobile release is ready
11. **Co-hosts Management** — Invite and manage co-hosts
12. **Listing Photo Management** — Upload, reorder, delete property photos
13. **Saved Searches** — Save and manage search preferences
14. **Map View** — Show properties on a map (react-native-maps)
15. **Forgot Password** — Password reset flow

### P3 — Low (Nice to Have)
16. **WebSocket Messaging** — Replace polling with real-time
17. **Offline Caching** — TanStack Query persistence
18. **Deep Linking** — Route mapping for push notification navigation
19. **Legal Pages** — Terms, Privacy, About screens
20. **Experiences** — When ready on web, implement on mobile
21. **Analytics Charts** — Native chart components for host dashboard

---

## 9. Files Modified in This Session

| File | Changes |
|------|---------|
| `app.json` | Renamed Sakan→Oikivo, updated colors to `#4F46E5` |
| `package.json` | Renamed `@sakan/mobile` → `@oikivo/mobile` |
| `tailwind.config.js` | Brand colors: `DEFAULT: #4F46E5, dark: #4338CA, light: #6366F1` |
| `app/_layout.tsx` | Animated gradient splash screen with reanimated |
| `app/(tabs)/index.tsx` | Animated property cards + logo header |
| `app/(tabs)/profile.tsx` | Animated user info, updated colors, renamed text |
| `app/(tabs)/_layout.tsx` | Tab bar active tint → `#4F46E5` |
| `app/auth/login.tsx` | Animated welcome text, renamed Oikivo |
| `app/auth/register.tsx` | Animated welcome text, renamed Oikivo |
| `app/rooms/[id].tsx` | Animated title section, updated icon colors |
| `app/hosting/dashboard.tsx` | Updated icon colors, renamed text |
| `app/hosting/listings.tsx` | Updated icon colors, renamed text |
| `app/profile/[id].tsx` | Updated icon colors |
| `src/components/ui/Animated.tsx` | **NEW** — Animation utilities (FadeIn, Stagger, SlideIn, ScaleIn) |
| `src/components/ui/Button.tsx` | Loading indicator color → `#4F46E5` |
| `src/components/ui/Spinner.tsx` | Default color → `#4F46E5` |
| `src/components/ui/Avatar.tsx` | Fallback palette updated |
| `src/components/SearchBar.tsx` | Icon color → `#4F46E5` |
| `src/components/StarRating.tsx` | Default color → `#4F46E5` |
| `src/lib/api.ts` | Token key → `oikivo_access_token` |
| `src/store/auth.store.ts` | Token/user keys → `oikivo_*` |
