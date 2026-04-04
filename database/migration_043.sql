-- Migration 043: Extend consultation_bookings.payment_status enum
-- Adds 'hold' (48h hold after session completion) and 'refund_pending'
-- (used when a consultant is suspended mid-booking).

ALTER TABLE consultation_bookings
  MODIFY COLUMN payment_status ENUM('pending','paid','refunded','hold','refund_pending') NOT NULL DEFAULT 'pending';
