-- Migration 008: Cancellation policy support
-- Adds cancellation_policy to properties and cancellation tracking fields to bookings

-- ── Add cancellation_policy to properties ──────────────────────────────────────
ALTER TABLE properties
  ADD COLUMN cancellation_policy ENUM('flexible','moderate','strict')
  NOT NULL DEFAULT 'flexible'
  AFTER instant_book;

-- ── Add cancellation tracking to bookings ──────────────────────────────────────
ALTER TABLE bookings
  ADD COLUMN cancellation_policy ENUM('flexible','moderate','strict') NULL
    COMMENT 'Snapshot of property policy at booking time'
    AFTER cancellation_reason,
  ADD COLUMN refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0
    COMMENT 'Amount refunded to guest'
    AFTER cancellation_policy,
  ADD COLUMN cancellation_fee DECIMAL(10,2) NOT NULL DEFAULT 0
    COMMENT 'Fee retained (host payout + platform retention)'
    AFTER refund_amount,
  ADD COLUMN cancelled_at DATETIME NULL
    COMMENT 'Exact timestamp of cancellation'
    AFTER cancellation_fee,
  ADD COLUMN cancelled_by ENUM('guest','host','admin','system') NULL
    COMMENT 'Who initiated the cancellation'
    AFTER cancelled_at;
