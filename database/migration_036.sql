-- ============================================================
-- Migration 036 — Security Deposit system
-- ============================================================
-- Tier 1 Host Protection: hosts can require a refundable security
-- deposit. Journey Stay holds it and releases it 48 h after
-- checkout if the host raises no damage claim.
--
-- Properties: one new column (how much the host wants to hold)
-- Bookings:   five new columns (per-booking deposit lifecycle)
-- ============================================================

-- 1. How much deposit the host requires for this listing (0 = none)
ALTER TABLE properties
  ADD COLUMN security_deposit DECIMAL(10, 2) NOT NULL DEFAULT 0.00
  AFTER cleaning_fee;

-- 2. Per-booking deposit snapshot (locked in at booking creation time)
ALTER TABLE bookings
  ADD COLUMN deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00
  AFTER total_amount;

-- 3. Lifecycle state for the deposit
--   none     — no deposit required for this booking
--   held     — deposit is held; host has 48 h after checkout to claim
--   claimed  — host submitted a damage claim; admin reviews
--   released — 48 h passed (or host waived claim); returned to guest
ALTER TABLE bookings
  ADD COLUMN deposit_status ENUM('none', 'held', 'claimed', 'released')
    NOT NULL DEFAULT 'none'
  AFTER deposit_amount;

-- 4. Deadline for the host to submit a claim (checkout + 48 h)
ALTER TABLE bookings
  ADD COLUMN deposit_claim_deadline DATETIME NULL
  AFTER deposit_status;

-- 5. Timestamp when the deposit was released back to the guest
ALTER TABLE bookings
  ADD COLUMN deposit_released_at DATETIME NULL
  AFTER deposit_claim_deadline;

-- 6. Host's description of alleged damage (required when claiming)
ALTER TABLE bookings
  ADD COLUMN deposit_claim_reason TEXT NULL
  AFTER deposit_released_at;

-- Index to let the scheduler efficiently find bookings whose 48-h
-- claim window has expired and whose deposit is still in 'held' state.
CREATE INDEX idx_bookings_deposit_release
  ON bookings (deposit_status, deposit_claim_deadline);
