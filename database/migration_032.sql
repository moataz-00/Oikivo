-- ============================================================
-- Migration 032: Make admin_id nullable in admin_activity_logs
-- Allows system-level events (e.g. failed login attempts) to be
-- logged without a corresponding admin user ID.
-- ============================================================

USE sakan_db;

ALTER TABLE admin_activity_logs
  MODIFY COLUMN admin_id BIGINT UNSIGNED NULL;
