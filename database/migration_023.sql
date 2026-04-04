-- migration_023: Add 'declined' to payment_status enum in bookings
-- Allows admin to decline a submitted InstaPay payment so the guest can retry.
USE sakan_db;

ALTER TABLE bookings
  MODIFY COLUMN payment_status
    ENUM('pending', 'submitted', 'paid', 'refunded', 'declined')
    NOT NULL DEFAULT 'pending';
