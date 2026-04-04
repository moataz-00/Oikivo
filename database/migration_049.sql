-- Migration 049: X4 booking modification history, X5 refund reason,
--                X6 user action timestamps, X7 audit_logs table
-- Applies to: bookings, users tables + new audit_logs table

-- X5: Refund reason on bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS refund_reason VARCHAR(500) NULL AFTER special_requests;

-- X4: Modification history (JSON) on bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS modification_history JSON NULL AFTER refund_reason;

-- X6: User action timestamps
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at DATETIME(6) NULL AFTER is_totp_enabled;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_booking_at DATETIME(6) NULL AFTER last_login_at;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_profile_edit_at DATETIME(6) NULL AFTER last_booking_at;

-- X7: Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type        VARCHAR(100)    NOT NULL,
  actor_id          BIGINT UNSIGNED NULL,
  entity_type       VARCHAR(50)     NOT NULL,
  entity_id         BIGINT UNSIGNED NULL,
  metadata          JSON            NULL,
  ip_address        VARCHAR(45)     NULL,
  created_at        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_audit_actor_date  (actor_id, created_at),
  INDEX idx_audit_entity      (entity_type, entity_id),
  INDEX idx_audit_event_date  (event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
