-- Migration 017: Stripe payment support
-- Adds stripe_payment_intent_id column and extends payment_method enum
-- Date: 2026-03-23

-- ─── bookings ────────────────────────────────────────────────────────────────
ALTER TABLE `bookings`
  MODIFY COLUMN `payment_method`
    ENUM('instapay', 'cash', 'card', 'stripe') NULL
    COMMENT 'Payment method used by guest';

ALTER TABLE `bookings`
  ADD COLUMN `stripe_payment_intent_id` VARCHAR(255) NULL
    COMMENT 'Stripe PaymentIntent ID for card payments'
  AFTER `payment_note`;

-- ─── experience_bookings ─────────────────────────────────────────────────────
ALTER TABLE `experience_bookings`
  MODIFY COLUMN `payment_method`
    ENUM('instapay', 'cash', 'card', 'stripe') NULL
    COMMENT 'Payment method used by guest';

ALTER TABLE `experience_bookings`
  ADD COLUMN `stripe_payment_intent_id` VARCHAR(255) NULL
    COMMENT 'Stripe PaymentIntent ID for card payments'
  AFTER `payment_reference`;
