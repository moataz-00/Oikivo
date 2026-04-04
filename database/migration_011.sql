-- Migration 011: Field length constraints for unbounded text columns
-- Date: 2026-03-22
-- Adds VARCHAR limits to previously unbounded TEXT fields to prevent abuse and improve storage characteristics.

-- ─── users.bio ────────────────────────────────────────────────────────────────
ALTER TABLE users
  MODIFY COLUMN bio VARCHAR(2000) DEFAULT NULL;

-- ─── bookings: guest_note, special_requests, cancellation_reason ──────────────
ALTER TABLE bookings
  MODIFY COLUMN guest_note          VARCHAR(2000) DEFAULT NULL,
  MODIFY COLUMN special_requests    VARCHAR(2000) DEFAULT NULL,
  MODIFY COLUMN cancellation_reason VARCHAR(1000) DEFAULT NULL;

-- ─── payouts: create table if not present, then constrain note ───────────────
CREATE TABLE IF NOT EXISTS payouts (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  host_id         BIGINT UNSIGNED NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'EGP',
  method          ENUM('instapay','bank_transfer','cash') NOT NULL DEFAULT 'instapay',
  account_details VARCHAR(500),
  status          ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  note            TEXT,
  processed_at    DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_payouts_host   (host_id),
  KEY idx_payouts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE payouts
  MODIFY COLUMN note VARCHAR(1000) DEFAULT NULL;
