-- Migration 019: Add payment_proof_url to bookings and experience_bookings
-- For InstaPay screenshot upload feature

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_proof_url VARCHAR(500) NULL AFTER payment_note;

-- Note: experience_bookings has no payment_note column, so we add after payment_reference
ALTER TABLE experience_bookings
  ADD COLUMN IF NOT EXISTS payment_proof_url VARCHAR(500) NULL AFTER payment_reference;
