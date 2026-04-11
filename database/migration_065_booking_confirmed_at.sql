-- =====================================================
-- Migration 065: Add confirmed_at and payment_reminder_sent_at to bookings
-- =====================================================
-- confirmed_at: set when a booking moves to 'confirmed' status
--   (either instant-book at creation or host accepting a request-to-book).
--   Used by scheduler crons to:
--     a) send a payment reminder to the guest 4 h after confirmation
--     b) auto-cancel unpaid confirmed bookings 24 h after confirmation
-- payment_reminder_sent_at: prevents the +4h reminder from being sent more than once.
-- =====================================================

ALTER TABLE `bookings`
  ADD COLUMN `confirmed_at` DATETIME NULL
    COMMENT 'Set when booking moves to confirmed status'
    AFTER `refund_reason`,
  ADD COLUMN `payment_reminder_sent_at` DATETIME NULL
    COMMENT 'Timestamp of the +4h payment reminder; prevents duplicate sends'
    AFTER `confirmed_at`;

-- Back-fill: for any existing confirmed / in_progress / completed bookings
-- we approximate confirmed_at as updated_at (best available proxy).
UPDATE `bookings`
SET `confirmed_at` = `updated_at`
WHERE `status` IN ('confirmed', 'in_progress', 'completed')
  AND `confirmed_at` IS NULL;
