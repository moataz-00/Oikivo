-- Migration 051: Add proof_viewed_at to bookings (WF-04)
-- Tracks when an admin first viewed the InstaPay payment proof.
-- The admin approval button is disabled until this field is set.

ALTER TABLE bookings
  ADD COLUMN proof_viewed_at DATETIME NULL AFTER payment_proof_url;
