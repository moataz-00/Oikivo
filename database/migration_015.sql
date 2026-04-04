-- Migration 015: Admin Activity Logs
-- Tracks all mutating admin actions for an audit trail

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id           BIGINT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  admin_id     BIGINT UNSIGNED    NOT NULL,
  action       VARCHAR(120)       NOT NULL,
  entity_type  VARCHAR(60)        NULL,
  entity_id    VARCHAR(60)        NULL,
  details      JSON               NULL,
  ip_address   VARCHAR(45)        NULL,
  created_at   TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_admin_activity_admin_id  (admin_id),
  INDEX idx_admin_activity_created   (created_at),
  CONSTRAINT fk_activity_admin FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE CASCADE
);
