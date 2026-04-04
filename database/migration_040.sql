-- Migration 040: Add is_consultant flag to users table
-- Set to true when admin approves a consultant application

ALTER TABLE users
  ADD COLUMN is_consultant TINYINT(1) NOT NULL DEFAULT 0 AFTER is_superhost;

CREATE INDEX idx_users_is_consultant ON users (is_consultant);
