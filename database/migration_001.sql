-- ============================================================
-- Migration 001 — Fix bookings table columns + properties draft support
-- Run this against your sakan_db database
-- ============================================================

USE sakan_db;

-- Add missing payment columns to bookings table
ALTER TABLE bookings
  ADD COLUMN payment_method   ENUM('instapay','cash','card') NULL AFTER payment_status,
  ADD COLUMN payment_reference VARCHAR(100)                  NULL AFTER payment_method,
  ADD COLUMN payment_note      TEXT                          NULL AFTER payment_reference;

-- Fix payment_status enum to include 'submitted'
ALTER TABLE bookings
  MODIFY COLUMN payment_status ENUM('pending','submitted','paid','refunded') NOT NULL DEFAULT 'pending';

-- Allow price_per_night to be NULL so drafts can be saved without a price
ALTER TABLE properties
  MODIFY COLUMN price_per_night DECIMAL(10,2) NULL;

-- ============================================================
-- Fix existing users who registered without email verification
-- so they can log in immediately (dev/local only)
-- ============================================================
UPDATE users SET is_email_verified = 1 WHERE is_email_verified = 0;
