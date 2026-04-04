-- Migration 013: Verification tokens table
-- Date: 2026-03-22
-- Stores one-time tokens/codes for email and phone verification workflows.

CREATE TABLE IF NOT EXISTS verification_tokens (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       ENUM('email','phone') NOT NULL DEFAULT 'email',
  token      VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_verification_tokens_user_type (user_id, type),
  INDEX idx_verification_tokens_token     (token),

  CONSTRAINT fk_vt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
