# Consultation Marketplace — Primary Feature

> **Oikivo's competitive edge**: A marketplace where verified, experienced hosts offer paid consultation sessions to new/unqualified hosts, with a **10% platform commission** on every session.

---

## Architecture Overview

| Layer | Technology | Location |
|-------|-----------|----------|
| Database | MySQL / MariaDB | `database/migration_039.sql` |
| Backend | NestJS + TypeORM | `packages/backend/src/consultations/` |
| Shared Types | TypeScript | `packages/shared/src/index.ts` |
| Web Frontend | Next.js 14 (App Router) | `packages/web/src/app/[locale]/consultations/` |
| Admin Panel | Next.js | `packages/admin/src/app/(dashboard)/consultations/` |
| i18n | next-intl (EN + AR) | `packages/web/src/messages/{en,ar}.json` |

---

## Implemented Features

### 1. Consultant Profiles & Verification
- Hosts apply to become consultants with personal info, specializations, years of experience, hourly rate, languages spoken
- Upload verification documents (certificates, licenses, portfolio, ID)
- Admin reviews and approves/rejects applications
- Status lifecycle: `pending_review` → `approved` / `rejected` / `suspended`
- Only hosts (`isHost: true`) can apply

### 2. Consultation Services
- Consultants create service listings with title, description, price, duration
- Delivery modes: `video`, `audio`, `in_person`, `chat`
- Each service independently priced and togglable

### 3. Session Booking & Payment
- Guests/new hosts browse approved consultants in a public marketplace
- Book a session by selecting service, date, and time slot
- **Platform fee**: 10% automatically calculated and stored on each booking
- Payment methods: Card (Stripe), InstaPay, Cash
- Booking status flow: `pending` → `confirmed` → `in_progress` → `completed` / `cancelled` / `disputed`
- On completion, earnings record created for consultant payout

### 4. Reviews & Ratings
- After session completion, clients leave a 1–5 star rating + comment
- Consultant's average rating and review count auto-updated
- One review per booking (unique constraint)

### 5. Consultant Availability
- Weekly recurring availability slots (day of week, start time, end time)
- Displayed on consultant profile for booking time selection

### 6. Admin Dashboard
- Stats overview: total consultants, pending applications, completed sessions, platform revenue
- Consultant table with filter by status, approve/reject with reason, view details + documents

### 7. Navigation & i18n
- "Consultations" link in web Navbar dropdown menu
- "Consultations" section in admin sidebar under "Marketplace"
- Full English and Arabic translations for all consultation UI strings

---

## Database Tables (migration_039)

| Table | Purpose |
|-------|---------|
| `consultants` | Consultant profiles linked to users |
| `consultant_documents` | Uploaded verification documents |
| `consultation_services` | Services offered by consultants |
| `consultation_bookings` | Session bookings with fee breakdown |
| `consultation_reviews` | Client reviews and ratings |
| `consultant_availability` | Weekly time slots |

---

## API Endpoints

### Public (no auth)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/consultations` | Browse approved consultants (paginated, filterable) |
| GET | `/consultations/:uuid` | Get consultant profile |


### Authenticated
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/consultations/apply` | Apply as consultant (multipart/form-data) |
| GET | `/consultations/my-profile` | Get own consultant profile |
| POST | `/consultations/services` | Create a service listing |
| POST | `/consultations/book` | Book a consultation session |
| PATCH | `/consultations/bookings/:id/confirm` | Consultant confirms booking |
| PATCH | `/consultations/bookings/:id/complete` | Mark session completed |
| PATCH | `/consultations/bookings/:id/cancel` | Cancel booking |
| POST | `/consultations/review` | Review a completed session |
| GET | `/consultations/my-bookings` | List own bookings (as client or consultant) |


### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/consultations/stats` | Dashboard statistics |
| GET | `/admin/consultations/consultants` | All consultants with filters |
| PATCH | `/admin/consultations/consultants/:id/review` | Approve/reject consultant |


---

## Web Pages

| Page | Route | Description |
|------|-------|-------------|
| Marketplace | `/consultations` | Hero, search, filters, consultant cards grid |
| Profile | `/consultations/:id` | Full consultant profile, services, reviews, booking CTA |
| Apply | `/consultations/apply` | 3-step form: info → expertise → documents |
| Book | `/consultations/book` | Service, date/time picker, price breakdown, payment |


---

## Missing / Future Features

### High Priority
1. **Video/Audio Call Integration** — Integrate Twilio, Daily.co, or Agora for in-app video calls with session recording and auto-end timer
2. **Real-time Chat During Sessions** — Use existing WebSocket messages module for live chat between consultant and client during booked sessions
3. **Consultant Calendar Sync** — Google Calendar / Apple Calendar integration so consultants' availability auto-syncs and prevents double-booking
4. **Session Notes & Action Items** — Post-session summary that consultants can fill out with actionable steps for the client
5. **Notification Triggers** — Email + push notifications for: application status change, new booking, booking reminder (1hr before), session completed, payment received
6. **Payout Integration** — Connect with existing payout module so consultant earnings appear in their payout dashboard

### Medium Priority
7. **AI-Powered Matching** — Recommend consultants based on the new host's property type, location, specific challenges (e.g., "low occupancy rate")
8. **Consultation Packages** — Allow consultants to offer bundles (e.g., 3 sessions for 15% discount)
9. **Follow-up Booking** — Quick rebook with the same consultant for return clients
10. **Dispute Resolution for Consultations** — Extend existing disputes module to handle consultation-related complaints
11. **Consultant Badges & Tiers** — Bronze/Silver/Gold tiers based on completed sessions and ratings (e.g., 50+ sessions with 4.8+ = Gold)
12. **Mobile App Screens** — Native consultation marketplace, booking, and session screens for the Expo mobile app

### Nice to Have
14. **Consultant Portfolio Page** — Photo gallery of properties they've helped optimize, before/after transformations
15. **Consultation Analytics** — Dashboard for consultants showing earnings graph, booking trends, popular services
16. **Group Sessions** — Allow a consultant to host a session with multiple clients (e.g., "How to list your first property" webinar)
17. **Referral Program** — Clients who refer new hosts to consultants get a discount on their next session
18. **Session Transcript** — AI-generated summary of video/audio sessions
19. **Seasonal Pricing** — Consultants can set different rates for peak/off-peak seasons
20. **Multi-Currency Support** — Support USD and EUR for consultants who serve international hosts

---

## Additional Competitive Edge Suggestions

### 1. Property Performance Score & AI Recommendations
Give every property a "Performance Score" (based on occupancy, revenue, reviews). Connect this score to the consultation marketplace — low-scoring properties get prompted to book a consultant. AI flags specific improvement areas.

### 2. Host Onboarding Funnel
Guided step-by-step flow for new hosts: list property → get auto-matched consultant → first free 15-min intro session → optional paid deep-dive. Reduces the barrier and converts more sign-ups into active hosts.

### 3. Quality Guarantee Badge
"Consultant-Approved Property" badge displayed on listings that have been reviewed by a certified consultant. Increases guest trust and booking conversion. Consultants earn a one-time certification fee.

### 4. Managed Hosting Program
Combine consultations into a "Managed Hosting" tier: the platform handles pricing optimization, guest communication, and connects hosts with top consultants for ongoing management. Revenue share model (e.g., 20% of booking revenue).

### 5. Insurance & Legal Consultation
Partner with local insurance providers and legal advisors. Hosts can get property insurance quotes and lease agreement reviews directly through the marketplace.

### 6. Dynamic Pricing Engine
AI-driven pricing suggestions that consultants can fine-tune for their clients. Competitive advantage over static pricing on other platforms.

### 7. Community & Knowledge Base
Forum & article section where consultants publish hosting tips, market analysis, seasonal strategies. Freemium content drives traffic; premium content behind consultant booking CTA.

### 8. Co-Hosting Marketplace Extension
Link the existing co-host feature with consultations — a consultant who proves their value can transition to a co-host role for ongoing management.

---

## Revenue Model

| Revenue Stream | Rate | Description |
|---------------|------|-------------|
| **Consultation Fee** | 10% per session | Platform cut from every completed consultation booking |
| **Featured Consultant** | TBD | Paid promotion to appear at the top of the marketplace |
| **Managed Hosting** | 15-20% of booking revenue | Full-service management for hands-off hosts |
| **Certification Badge** | One-time fee | "Consultant-Approved" badge for listings |

---

## File Inventory

### Database
- `database/migration_039.sql`

### Backend
- `packages/backend/src/consultations/consultations.module.ts`
- `packages/backend/src/consultations/consultations.service.ts`
- `packages/backend/src/consultations/consultations.controller.ts`
- `packages/backend/src/consultations/dto/consultations.dto.ts`
- `packages/backend/src/entities/consultant.entity.ts`
- `packages/backend/src/entities/consultant-document.entity.ts`
- `packages/backend/src/entities/consultation-service.entity.ts`
- `packages/backend/src/entities/consultation-booking.entity.ts`
- `packages/backend/src/entities/consultation-review.entity.ts`
- `packages/backend/src/entities/consultant-availability.entity.ts`


### Web Frontend
- `packages/web/src/app/[locale]/consultations/page.tsx`
- `packages/web/src/app/[locale]/consultations/[id]/page.tsx`
- `packages/web/src/app/[locale]/consultations/apply/page.tsx`
- `packages/web/src/app/[locale]/consultations/book/page.tsx`


### Admin Panel
- `packages/admin/src/app/(dashboard)/consultations/page.tsx`

### Modified Files
- `packages/backend/src/app.module.ts` — Registered ConsultationsModule + entities
- `packages/shared/src/index.ts` — Added consultation types/enums/interfaces
- `packages/web/src/lib/api.ts` — Added `consultationsApi`
- `packages/admin/src/lib/api.ts` — Added consultation admin endpoints
- `packages/admin/src/app/(dashboard)/layout.tsx` — Added Marketplace nav section
- `packages/web/src/components/layout/Navbar.tsx` — Added Consultations menu link
- `packages/web/src/messages/en.json` — Added consultation translations
- `packages/web/src/messages/ar.json` — Added Arabic consultation translations
