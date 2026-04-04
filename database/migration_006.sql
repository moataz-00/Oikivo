-- Migration 006: Weekend pricing & long-stay discounts
-- Adds weekend_price, weekly_discount_percent, monthly_discount_percent to properties

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS weekend_price DECIMAL(10,2) NULL AFTER price_per_night,
  ADD COLUMN IF NOT EXISTS weekly_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER weekend_price,
  ADD COLUMN IF NOT EXISTS monthly_discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER weekly_discount_percent;
