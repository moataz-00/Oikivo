-- ============================================================
-- Migration 031: Remove long-term rent feature
-- Reverses migration_025 and migration_030.
-- Drops listing_type, price_per_month, min_months, deposit_amount,
-- duration_type, months, and all discount tier columns.
-- ============================================================

USE sakan_db;

-- ─── properties ──────────────────────────────────────────────────────────────

ALTER TABLE properties
  DROP COLUMN IF EXISTS listing_type,
  DROP COLUMN IF EXISTS price_per_month,
  DROP COLUMN IF EXISTS min_months,
  DROP COLUMN IF EXISTS deposit_amount,
  DROP COLUMN IF EXISTS discount_3_months,
  DROP COLUMN IF EXISTS discount_6_months,
  DROP COLUMN IF EXISTS discount_9_months,
  DROP COLUMN IF EXISTS discount_12_months;

-- ─── bookings ────────────────────────────────────────────────────────────────

ALTER TABLE bookings
  DROP COLUMN IF EXISTS duration_type,
  DROP COLUMN IF EXISTS months;
