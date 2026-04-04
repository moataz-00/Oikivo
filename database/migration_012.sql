-- Migration 012: Dispute resolution system
-- Date: 2026-03-22
-- Allows guests or hosts to open formal disputes on completed or cancelled bookings.

CREATE TABLE disputes (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id      BIGINT UNSIGNED NOT NULL,
  raised_by_id    BIGINT UNSIGNED NOT NULL,
  category        ENUM(
                    'property_not_as_described',
                    'no_show',
                    'safety_concern',
                    'refund_request',
                    'damage_claim',
                    'other'
                  ) NOT NULL DEFAULT 'other',
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  status          ENUM('open','under_review','resolved','closed') NOT NULL DEFAULT 'open',
  resolution      ENUM('resolved_for_guest','resolved_for_host','dismissed','split') DEFAULT NULL,
  admin_note      TEXT DEFAULT NULL,
  resolved_at     DATETIME DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_disputes_booking    (booking_id),
  INDEX idx_disputes_raised_by  (raised_by_id),
  INDEX idx_disputes_status     (status),

  CONSTRAINT fk_disputes_booking   FOREIGN KEY (booking_id)   REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_disputes_raised_by FOREIGN KEY (raised_by_id) REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
