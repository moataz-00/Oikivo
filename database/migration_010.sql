-- Migration 010: Turnover days, rating constraints, and performance indexes

-- ── Add turnover_days to properties ───────────────────────────────────────────
-- Number of days between check-out and next available check-in (cleaning buffer)
ALTER TABLE properties
  ADD COLUMN turnover_days TINYINT NOT NULL DEFAULT 1
    COMMENT 'Cleaning/preparation buffer days between bookings'
    AFTER max_nights;

-- ── Rating constraints on reviews ─────────────────────────────────────────────
ALTER TABLE reviews
  ADD CONSTRAINT chk_overall_rating      CHECK (overall_rating      BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_cleanliness_rating  CHECK (cleanliness_rating  BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_accuracy_rating     CHECK (accuracy_rating     BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_communication_rating CHECK (communication_rating BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_location_rating     CHECK (location_rating     BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_value_rating        CHECK (value_rating        BETWEEN 1 AND 5),
  ADD CONSTRAINT chk_checkin_rating      CHECK (checkin_rating      BETWEEN 1 AND 5);

-- ── Performance indexes ────────────────────────────────────────────────────────
CREATE INDEX idx_bookings_created_at   ON bookings(created_at);
CREATE INDEX idx_properties_created_at ON properties(created_at);

-- ── Index to speed up idempotency check in create booking ─────────────────────
CREATE INDEX idx_bookings_idempotency
  ON bookings(guest_id, property_id, check_in, check_out, created_at);
