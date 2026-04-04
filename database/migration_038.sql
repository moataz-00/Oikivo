-- ============================================================
-- Migration 038 — New listing promotion, last-minute discount,
--                  and booking mode (approve-first-three)
-- ============================================================
-- 1. new_listing_promotion_enabled  — 20 % off the first 3 bookings
-- 2. last_minute_discount_percent   — % off for bookings made ≤14 days
--                                     before arrival (default 0)
-- 3. booking_mode                   — 'instant_book' | 'approve_first_three'
--                                     ('approve_first_three' means the host
--                                     manually approves the first 3 bookings,
--                                     then the property auto-switches to
--                                     instant book)
-- 4. approved_bookings_count        — tracks how many bookings the host has
--                                     approved for approve_first_three mode
-- ============================================================

ALTER TABLE properties
  ADD COLUMN new_listing_promotion_enabled TINYINT(1) NOT NULL DEFAULT 0
  AFTER monthly_discount_percent;

ALTER TABLE properties
  ADD COLUMN last_minute_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00
  AFTER new_listing_promotion_enabled;

ALTER TABLE properties
  ADD COLUMN booking_mode ENUM('instant_book', 'approve_first_three')
    NOT NULL DEFAULT 'instant_book'
  AFTER last_minute_discount_percent;

ALTER TABLE properties
  ADD COLUMN approved_bookings_count INT UNSIGNED NOT NULL DEFAULT 0
  AFTER booking_mode;

-- Index to help queries that filter by booking_mode
CREATE INDEX idx_properties_booking_mode
  ON properties (booking_mode);
