# Oikivo Web — RTL / Arabic i18n Audit

**Date**: 2025  
**Scope**: `packages/web` — all pages, components, translation files  
**Locales**: `en` (LTR), `ar` (RTL)

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | Fixed |
| 🟠 Major | 2 | Fixed |
| 🟡 Minor | 4 | Noted |

---

## 🔴 Critical Issues

### 1. `<html>` element missing `lang` and `dir` attributes

**File**: `packages/web/src/app/layout.tsx`  
**Problem**: The root layout renders `<html>` with no `lang` or `dir`. These attributes are applied to an inner `<div>` in `[locale]/layout.tsx`. The `html` element's `dir` controls:
- Browser scrollbar position (should be on left for RTL)
- Native form control default direction
- CSS `:dir()` pseudo-class
- Accessibility tree document language

**Fix Applied**: Added `getLocale()` from `next-intl/server` to set `lang={locale}` and `dir={locale === 'ar' ? 'rtl' : 'ltr'}` on the `<html>` element.

---

### 2. Corrupted Arabic translations in `hosting` section (45+ keys)

**File**: `packages/web/src/messages/ar.json`  
**Problem**: The entire earnings, analytics, payout, and reviews sub-sections of `hosting` contain `?????` placeholder values instead of real Arabic text. Affected keys (partial list):

- `earningsTitle`, `earningsDesc`, `requestPayout`, `totalEarned`
- `availableBalance`, `pendingBalance`, `paidOut`
- `monthlyEarnings`, `revenueByProperty`, `earningRecords`, `noEarningsYet`
- `payoutHistory`, `booking`, `bookings`
- `requestedLabel`, `processingLabel`, `transferredLabel`, `failedLabel`
- `payoutSubmitted`, `payoutFailed`, `availableBalanceLabel`, `amountLabel`
- `methodLabel`, `accountDetailsLabel`, `accountDetailsPlaceholder`, `noteLabel`
- `submitRequest`, `pendingManualTransfer`
- `analyticsTitle`, `analyticsDesc`, `monthlyPerformance`, `revenue`
- `bookingStatus`, `revenueBreakdown`, `occupancyRate`, `avgRating`
- `totalBookings`, `totalRevenue`
- `guestReviews`, `guestReviewsDesc`, `replyToReview`, `replyPlaceholder`
- `postReply`, `cancelReply`, `replyPosted`, `yourReply`, `posting`
- `noReviewsYet`, `noReviewsYetDesc`, `awaitingReply`, `repliedReviews`
- `confirmed`, `cancelled`, `completed`, `allReservations`, `upcoming`, `past`, `noResultsFound`

**Fix Applied**: All keys replaced with proper Arabic translations.

Additionally, a duplicate `newListing` key existed in the `hosting` section — first instance removed.

---

### 3. `trips.totalAmount` key mismatch (en ↔ ar)

**File**: `packages/web/src/messages/ar.json`  
**Problem**: English (`en.json`) has `trips.totalAmount` but Arabic (`ar.json`) had `trips.total` — a different key name. Any component calling `t('trips.totalAmount')` in Arabic would render the key string literally as a translation key leak.

**Fix Applied**: Renamed `trips.total` → `trips.totalAmount` in `ar.json`.

---

## 🟠 Major Issues

### 4. `Input.tsx` uses physical CSS directional properties

**File**: `packages/web/src/components/ui/Input.tsx`  
**Problem**: Icon positioning and padding use physical left/right properties. In RTL layout, a "left icon" should appear on the right side.

| Broken | Fixed |
|--------|-------|
| `left-0` | `start-0` |
| `pl-3` | `ps-3` |
| `pl-10` | `ps-10` |
| `right-0` | `end-0` |
| `pr-3` | `pe-3` |
| `pr-10` | `pe-10` |

Also added `dir="auto"` to the `<input>` element so each input detects its text direction independently (important for email fields that stay LTR even in RTL pages).

**Fix Applied**.

---

### 5. `Select.tsx` uses physical CSS for item indicator

**File**: `packages/web/src/components/ui/Select.tsx`  
**Problem**: The checkmark indicator in dropdown items uses `right-2.5` (absolute physical) and `pr-8` (physical padding).

| Broken | Fixed |
|--------|-------|
| `pr-8` | `pe-8` |
| `right-2.5` | `end-2.5` |

**Fix Applied**.

---

## 🟡 Minor / Informational

### 6. Login page left panel contains hardcoded English content

**File**: `packages/web/src/app/[locale]/login/page.tsx`  
**Notes**: The decorative left panel (features list, stats, tagline) is hardcoded in English and not using `t()`. This does not cause a crash but shows English text in Arabic mode. The panel is `hidden` on mobile so impact is limited to desktop.  
**Recommendation**: Extract text to `auth` namespace keys and translate.

### 7. TOTP modal has hardcoded English text

**File**: `packages/web/src/app/[locale]/login/page.tsx`  
**Notes**: "Two-Factor Authentication", "Enter the 6-digit code...", "Verify & Sign in", "← Back to login" are all English literals.  
**Recommendation**: Add keys to `auth` namespace.

### 8. `InboxView.tsx`, `SearchBar.tsx`, `BookingWidget.tsx` use `pl-`, `pr-`, `ml-`, `mr-` classes

**Files**: Several components  
**Notes**: These are mostly used for specific icon-padded inputs and spacing, not for symmetric layout. Tailwind's `rtl:` variant can be used to add `rtl:pl-0 rtl:pr-10` overrides where the icon position needs to flip. The impact depends on whether these components show icons that need to mirror.  
**Recommendation**: Audit each usage and add `rtl:` variants for any icon-adjacent padding.

### 9. `ChevronRight` icons not flipped in RTL in Navbar

**File**: `packages/web/src/components/layout/Navbar.tsx`  
**Notes**: Chevron/arrow icons pointing right in LTR should point left in RTL. Use `rtl:rotate-180` or `rtl:scale-x-[-1]` on these icons.

---

## Translation Key Coverage

Both `en.json` and `ar.json` are ~953 lines and cover all namespaces:
`nav`, `home`, `property`, `booking`, `trips`, `wishlists`, `hosting`, `auth`, `account`, `payment`, `common`, `filter`, `inbox`, `profile`, `footer`, `notifications`, `search`, `experiences`, `travel`, `consultations`, `priceAlert`

After fixes: all keys in `en.json` have corresponding Arabic translations in `ar.json`.

---

## How RTL Is Wired

```
app/layout.tsx          → <html lang={locale} dir={dir}>  (FIXED)
[locale]/layout.tsx     → <div lang={locale} dir={dir}>   (still present, redundant but harmless)
globals.css             → [lang="ar"] { font-family: Cairo }
tailwind.config.ts      → rtl: variant available (no plugin needed, Tailwind v3 built-in)
```

The `rtl:` Tailwind variant fires when any ancestor has `dir="rtl"`. Since both `html` and the wrapper `div` now have `dir="rtl"` for Arabic, all `rtl:` classes work correctly.
