-- ============================================================
-- Migration 003 — Add archived_at timestamp to properties
-- Run once: mysql -u root -p sakan_db < database/migration_003.sql
-- ============================================================

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;
