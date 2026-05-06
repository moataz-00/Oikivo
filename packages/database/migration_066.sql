-- Migration 066: Add nightly_rates JSON column to bookings
-- Stores per-night price breakdown at booking creation time so the
-- trips detail and export pages can show accurate per-night rates
-- even if the host later changes their calendar pricing.

ALTER TABLE `bookings`
  ADD COLUMN `nightly_rates` JSON NULL
    COMMENT 'Per-night price breakdown [{date,price}] stored at booking creation time'
  AFTER `discount_type`;
