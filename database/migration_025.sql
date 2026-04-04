-- ============================================================
-- Migration 025: Long-term rent feature
-- Adds listing_type, price_per_month, min_months, deposit_amount
-- to the properties table.
-- Adds duration_type and months columns to bookings table.
-- ============================================================

USE sakan_db;

-- ─── properties ──────────────────────────────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS listing_type
    ENUM('short_term','long_term','both') NOT NULL DEFAULT 'short_term'
    AFTER status;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS price_per_month
    DECIMAL(10,2) NULL DEFAULT NULL
    AFTER price_per_night;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS min_months
    TINYINT UNSIGNED NOT NULL DEFAULT 1
    AFTER min_nights;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS deposit_amount
    DECIMAL(10,2) NULL DEFAULT NULL
    AFTER price_per_month;

-- ─── bookings ────────────────────────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS duration_type
    ENUM('nightly','monthly') NOT NULL DEFAULT 'nightly'
    AFTER nights;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS months
    TINYINT UNSIGNED NOT NULL DEFAULT 0
    AFTER duration_type;
