# Consultation Feature Audit
> Status as of current codebase snapshot. Items marked ✅ are done, ❌ are missing/broken, ⚠️ are partially done.

---

## 1. Bugs Fixed (This Session)

| # | Bug | File | Fix Applied |
|---|-----|------|-------------|
| B1 | TypeORM `orderBy` crash on snake_case column names (`is_featured`, `avg_rating`, `total_sessions`) | `consultations.service.ts` | Changed to entity property names (`isFeatured`, `avgRating`, `totalSessions`) |
| B2 | Consultants not loading on home page — wrong API path `/consultations` instead of `/consultations/consultants` | `web/src/lib/api.ts` | Fixed URL |
| B3 | Home page consultant links used `c.uuid` but route requires numeric `c.id` | `web/src/app/[locale]/page.tsx` | Fixed href to use `c.id` |
| B4 | `grid.svg` 404 breaking home page background | `web/public/grid.svg` | Created the file |
| B5 | `consultations.service.ts` class was missing `getApprovedConsultant` method body and closing `}` (introduced by a bad automated edit) | `consultations.service.ts` | Restored |

---

## 2. Completed Features (This Session)

### 2.1 `is_consultant` User Badge
- ✅ **DB**: `database/migration_040.sql` — adds `is_consultant TINYINT(1)` column to `users` table with an index
- ✅ **Backend entity**: `UserEntity.isConsultant` field added
- ✅ **Admin approval flow**: `adminReviewConsultant()` sets `user.isConsultant = true` on approval, `false` on rejection/suspension
- ✅ **Frontend auth hook**: `useAuth()` now exposes `isConsultant` derived from `user?.isConsultant`

### 2.2 Slot-Based Booking
- ✅ **Backend**: `getAvailableSlots(consultantId, date, durationMinutes)` in `ConsultationsService` — reads weekly availability windows, excludes confirmed/pending bookings, returns ISO time strings
- ✅ **Backend**: `GET /consultations/consultants/:id/slots?date=YYYY-MM-DD&durationMinutes=N` endpoint
- ✅ **Frontend**: Booking modal on consultant profile page (`[id]/page.tsx`) now shows a date picker → fetches real slots via `useQuery` → renders clickable time chips
- ✅ **Frontend API**: `consultationsApi.getConsultantSlots(id, date, durationMinutes)`

### 2.3 Consultant Dashboard (`/[locale]/consultations/dashboard`)
- ✅ Statistics cards: total sessions, pending requests, confirmed upcoming, total earnings (EGP), avg rating, review count
- ✅ Upcoming bookings table with Accept / Decline actions for pending bookings
- ✅ Recent reviews tab
- ✅ Quick-action links: profile settings, manage availability, my services
- ✅ Auth guards: redirects to login if unauthenticated; shows "apply" CTA if logged in but not a consultant
- ✅ Backend: `getConsultantStats(userId)` service method + `GET /consultations/my-stats` endpoint
- ✅ Booking respond API: `consultationsApi.respondBooking(id, action)`

---

## 3. Missing Features (Not Yet Built)

### ✅ 3.1 Email Notifications — DONE
- ✅ 7 HTML email templates added to `mail.service.ts`:
  - `tplConsultationRequestReceived` — sent to consultant when new booking arrives
  - `tplConsultationRequestSubmitted` — sent to client after booking (non-InstaPay)
  - `tplConsultationInstapayPending` — sent to client with InstaPay transfer instructions
  - `tplConsultationConfirmed` — sent to client when consultant accepts, includes meeting link if set
  - `tplConsultationDeclined` — sent to client when consultant declines, includes decline reason
  - `tplConsultationReminder` — 24h reminder template (both parties, call from a cron job)
  - `tplConsultationCompleted` — sent to client after session completes with ⭐ review CTA
- ✅ `MailModule` imported into `ConsultationsModule`
- ✅ `MailService` + `ConfigService` injected into `ConsultationsService`
- ✅ Emails automatically sent in: `bookConsultation()`, `respondToBooking()`, `completeBooking()`
- ✅ 24h cron scheduler implemented: `ConsultationSchedulerService` (`@Cron('0 8 * * *')`) finds confirmed bookings due in 20–28 h and sends `tplConsultationReminder` to both parties

### ✅ 3.2 Meeting Link — Manual Entry Implemented
- ✅ `consultation_bookings.meeting_link` column exists and is returned in booking API responses
- ✅ Consultant dashboard **confirm flow** now shows an optional meeting link input before confirming a booking
  - Accept button reveals inline form with URL input + Confirm/Cancel
  - Link passed as `meetingLink` to `PATCH /consultations/bookings/:id/respond`
- ✅ Meeting link shown as "Join Session" button in client's `my-bookings` page
- ✅ Meeting link included in `tplConsultationConfirmed` email to client
- ℹ️ Whereby Rooms / Cal.com auto-generation deferred to a future phase

### ✅ 3.3 Payment Gateway (InstaPay — Egypt only)
- ✅ `paymentMethod` enum in `ConsultationBookingEntity` already had `'instapay'` value
- ✅ Booking modal (`[id]/page.tsx`) shows payment method step — InstaPay selected by default; card option shown but disabled
- ✅ InstaPay instructions box shown in modal (phone + name from `NEXT_PUBLIC_INSTAPAY_PHONE` / `NEXT_PUBLIC_INSTAPAY_NAME` env vars)
- ✅ `paymentMethod: 'instapay'` passed in `POST /consultations/book` payload
- ✅ New endpoint `PATCH /consultations/bookings/:id/mark-instapay-paid` — consultant confirms payment received
- ✅ New `consultationsApi.markInstapayPaid(id)` in frontend API
- ✅ InstaPay booking sends `tplConsultationInstapayPending` email with transfer instructions and booking reference

### ✅ 3.4 Client Booking Management Page — DONE
- ✅ New page at `/[locale]/consultations/my-bookings/page.tsx`
- ✅ Tabs: Upcoming / Past / All
- ✅ Shows: consultant name, service, date/time, duration, delivery mode, price, payment status
- ✅ Displays meeting link (Join Session) when booking is confirmed and link is set
- ✅ Shows InstaPay pending notice for unconfirmed InstaPay bookings
- ✅ Cancel button with confirmation step (for upcoming bookings in pending/confirmed state)
- ✅ Review button → star rating modal for completed sessions without an existing review
- ✅ `consultationsApi.reviewBooking(bookingId, payload)` added to api.ts

### ✅ 3.5 Consultant Badge on Public Cards — DONE
- ✅ `CheckCircle` icon + "Verified" / "موثّق" label added to consultant listing cards
- ✅ Badge shown when `c.user?.isConsultant === true`
- ✅ "Consultant Dashboard" link added to Navbar user menu (visible only when `isConsultant === true`)
  - Uses `LayoutDashboard` icon from Lucide
  - Links to `/[locale]/consultations/dashboard`

### ✅ 3.6 Admin: Document Review UI — DONE
- ✅ Admin detail modal now shows each document with colored status badge (pending=amber, verified=green, rejected=red)
- ✅ Image documents show a full-width thumbnail preview (auto-hides on error)
- ✅ "View" button links to `d.fileUrl` in a new tab with the `download` attribute
- ✅ Document type label displayed below file name

### ✅ 3.7 Availability Management Page — DONE
- ✅ New page at `/[locale]/consultations/availability/page.tsx`
- ✅ Weekly grid: 7 toggle rows (Sun–Sat), each with start/end time pickers when enabled
- ✅ Pre-populates from `GET /consultations/my-profile` (availability relation now included)
- ✅ Saves via `POST /consultations/availability` with active slots only
- ✅ Success toast shows "Saved!" confirmation

### ✅ 3.8 My Services Management Page — DONE
- ✅ New page at `/[locale]/consultations/services/page.tsx`
- ✅ Lists all services with delivery mode icon, duration, price, active/inactive badge
- ✅ Inline create/edit form with full fields: title (EN+AR), description, duration, price, delivery mode, max bookings/day
- ✅ Toggle active/inactive inline with one click
- ✅ Delete with confirm step to prevent accidental removal
- ✅ `consultationsApi.updateService()` and `deleteService()` added to `api.ts`

### ✅ 3.9 My Profile Edit Page — DONE
- ✅ New page at `/[locale]/consultations/my-profile/page.tsx`
- ✅ Pre-populates all fields from `GET /consultations/my-profile`
- ✅ Editable fields: display name, bio (2000 char counter), years of experience, hourly rate
- ✅ Specialization chip-picker (multi-select toggle)
- ✅ Language picker: quick-add common languages + custom text input; removes with X button
- ✅ Saves via `PATCH /consultations/my-profile`; `consultationsApi.updateMyProfile()` added to `api.ts`

### ✅ 3.10 Search / Filter UI — DONE
- ✅ Search bar added to hero section of `/[locale]/consultations` — submits on Enter or button click
- ✅ `search` state wired to `consultationsApi.getConsultants({ search, specialization, page, limit })`
- ✅ Query key updated to `['consultants', specialization, search, page]` so results re-fetch on any change
- ✅ Clear (×) button resets search and re-fetches
- ✅ Switched import from raw `apiClient` to `consultationsApi` for consistency

### ✅ 3.11 Review System (Client Side) — DONE (previous session)
- ✅ Review modal in `/[locale]/consultations/my-bookings/page.tsx` with star rating + comment
- ✅ `consultationsApi.reviewBooking(bookingId, payload)` calls `POST /consultations/bookings/:id/review`

### ✅ 3.12 Consultant Reply to Review — DONE
- ✅ Dashboard reviews tab: reviews without a reply show a textarea + "Post Reply" button
- ✅ Reviews with an existing reply show it in a bordered quote block
- ✅ `replyMutation` calls `consultationsApi.replyToReview(reviewId, reply)` → `PATCH /consultations/reviews/:id/reply`
- ✅ Per-review draft state (`replyDrafts` map) so multiple replies can be typed simultaneously
- ✅ `consultationsApi.replyToReview()` added to `api.ts`

---

## 4. Security Gaps

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| S1 | Document upload: no server-side validation that `documentType` matches file mime type | Medium | ✅ Fixed — `DOC_TYPE_MIME` per-type map enforced post-multer in handler |
| S2 | `GET /consultations/consultants/:id/slots` is unauthenticated — can be used to enumerate consultant schedules | Low | ✅ Fixed — `@Throttle({ default: { ttl: 60000, limit: 30 } })` added |
| S3 | `uploads/consultant-docs/` folder is served publicly with no access control | High | ✅ Fixed — JWT middleware in `main.ts` intercepts `/uploads/consultant-docs` before static handler |
| S4 | No rate limiting on `POST /consultations/apply` — could be abused to flood the pending queue | Medium | ✅ Fixed — `@Throttle({ default: { ttl: 3600000, limit: 3 } })` added |
| S5 | `adminReviewConsultant` uses `superhost_achieved` notification type for consultant approval | Low | ✅ Fixed — changed to `consultant_approved` in `consultations.service.ts` |

---

## 5. Data Model Issues

| # | Issue | Impact | Status |
|---|-------|--------|--------|
| D1 | `consultation_bookings.scheduled_at` is a `DATETIME` with no timezone stored | Bookings may show wrong time cross-timezone | ✅ Fixed — `client_timezone VARCHAR(50)` column added to entity + migration_041.sql |
| D2 | `consultant_availability` has no timezone column | Wrong slots for international consultants | ✅ Fixed — `timezone VARCHAR(50)` column added to `ConsultantEntity` + migration_041.sql |
| D3 | No unique constraint on `(consultant_id, day_of_week, start_time)` | Ghost duplicate slots shown to users | ✅ Fixed — `@Unique` decorator on `ConsultantAvailabilityEntity` + migration_041.sql |
| D4 | `consultation_reviews` has no `is_hidden` or moderation flag | No way for admin to hide abusive reviews | ✅ Fixed — `isHidden` column added to entity; hidden reviews excluded from public profile |
| D5 | `consultant_bookings` uses `INT` for price columns — should be `DECIMAL(10,2)` | Rounding errors at scale | ✅ Verified — entity already `DECIMAL(10,2)`; migration_041.sql enforces it on DB |

---

## 6. Next Priority Order (Recommended)

1. **Frontend: Availability management page** — ✅ Done (standalone page at `/availability`)
2. **Frontend: My services page** — ✅ Done (CRUD at `/services`)
3. **Frontend: Client bookings page** — ✅ Done (tabs + cancel + review at `/my-bookings`)
4. **Apply form: Availability step** — ✅ Done (Step 4 in apply wizard with weekly schedule picker)
5. **Meeting link UI** — ✅ Done (inline confirm dialog in dashboard with optional URL input)
6. **Security: Upload access control** (S3) — high severity
7. **Payment integration** — required before real money flows
8. **Email notifications** — critical for booking confirmation UX
9. **Meeting link automation** (Whereby / Cal.com) — deferred
10. **Admin document review UI** — needed for proper KYC workflow
