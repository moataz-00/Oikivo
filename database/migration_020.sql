-- Migration 020: Add profile_uuid to users for secure profile URLs

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_uuid VARCHAR(36) NULL AFTER id;

-- Populate UUID for all existing users
UPDATE users SET profile_uuid = UUID() WHERE profile_uuid IS NULL;

-- Make it non-nullable and unique now that all rows have a value
ALTER TABLE users
  MODIFY COLUMN profile_uuid VARCHAR(36) NOT NULL,
  ADD UNIQUE INDEX idx_users_profile_uuid (profile_uuid);
