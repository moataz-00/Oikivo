-- Migration 045: G10/G24 consultation booking payment fields + G14 dispute additional_info
-- + G15/G16 pre-session reminder flag

-- ── consultation_bookings: expand payment_status enum ──────────────────────
ALTER TABLE consultation_bookings
  MODIFY COLUMN payment_status
    ENUM('pending','submitted','paid','refunded','hold','refund_pending')
    NOT NULL DEFAULT 'pending';

-- ── consultation_bookings: add payment proof columns ───────────────────────
ALTER TABLE consultation_bookings
  ADD COLUMN IF NOT EXISTS payment_reference    VARCHAR(255)       NULL        AFTER consultant_note,
  ADD COLUMN IF NOT EXISTS payment_proof_url    VARCHAR(500)       NULL        AFTER payment_reference,
  ADD COLUMN IF NOT EXISTS refund_amount        DECIMAL(10,2)      NOT NULL DEFAULT 0 AFTER payment_proof_url,
  ADD COLUMN IF NOT EXISTS cancellation_fee     DECIMAL(10,2)      NOT NULL DEFAULT 0 AFTER refund_amount,
  ADD COLUMN IF NOT EXISTS pre_session_reminder_sent TINYINT(1)   NOT NULL DEFAULT 0 AFTER cancellation_fee;

-- ── disputes: add additional_info for guest updates (G14) ─────────────────
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS additional_info TEXT NULL AFTER admin_note;
