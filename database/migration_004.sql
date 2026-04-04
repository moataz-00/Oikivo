-- ============================================================
-- Migration 004 — Add UUID column to properties (for URL obfuscation)
-- Run once: mysql -u root -p sakan_db < database/migration_004.sql
-- ============================================================

ALTER TABLE `properties`
  ADD COLUMN `uuid` VARCHAR(36) NULL,
  ADD UNIQUE INDEX `UQ_properties_uuid` (`uuid`);

-- Back-fill UUIDs for all existing rows
UPDATE `properties` SET `uuid` = UUID() WHERE `uuid` IS NULL;
