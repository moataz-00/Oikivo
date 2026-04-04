-- Migration 030: Add long-term tier discount columns to properties
-- These replace the short-term weekly/monthly discounts for long_term listings.
-- Each tier applies when a tenant books >= N months.

ALTER TABLE properties
  ADD COLUMN discount_3_months  DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER monthly_discount_percent,
  ADD COLUMN discount_6_months  DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER discount_3_months,
  ADD COLUMN discount_9_months  DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER discount_6_months,
  ADD COLUMN discount_12_months DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER discount_9_months;
