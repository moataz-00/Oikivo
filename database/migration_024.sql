-- ============================================================
-- Migration 024: OPay payment integration
-- Adds opay_order_reference column to bookings tables and
-- extends payment_method enum to include opay-card and opay-wallet.
-- ============================================================

USE sakan_db;

-- ─── bookings ────────────────────────────────────────────────────────────────

ALTER TABLE bookings
  MODIFY COLUMN payment_method
    ENUM('instapay','cash','card','stripe','opay-card','opay-wallet') NULL;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS opay_order_reference VARCHAR(100) NULL
  AFTER stripe_payment_intent_id;

-- ─── experience_bookings ─────────────────────────────────────────────────────

ALTER TABLE experience_bookings
  MODIFY COLUMN payment_method
    ENUM('instapay','cash','card','stripe','opay-card','opay-wallet') NULL;

ALTER TABLE experience_bookings
  ADD COLUMN IF NOT EXISTS opay_order_reference VARCHAR(100) NULL
  AFTER stripe_payment_intent_id;
