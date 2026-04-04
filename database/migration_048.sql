-- migration_048: A2 TOTP 2FA columns + A3 User Sessions table

-- A2: Two-Factor Authentication (TOTP) columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255) NULL COMMENT '2FA TOTP secret (null when 2FA not set up)';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_totp_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether 2FA is active for this account';

-- A3: User Sessions tracking table
CREATE TABLE IF NOT EXISTS user_sessions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  ip_address     VARCHAR(45)  NULL,
  user_agent     VARCHAR(500) NULL,
  expires_at     TIMESTAMP    NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_sessions_user    (user_id),
  INDEX idx_user_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
