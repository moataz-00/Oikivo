-- migration_062_guest_screening_and_auto_reply.sql
-- Scope: H4 (require verified guest), H5 (min guest rating), H2 (auto-reply messaging), G6 (check-in fields)

-- 1) properties.require_verified_guest
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'require_verified_guest'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE properties ADD COLUMN require_verified_guest TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- 2) properties.min_guest_rating
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'min_guest_rating'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE properties ADD COLUMN min_guest_rating DECIMAL(2,1) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) properties.wifi_name
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'wifi_name'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE properties ADD COLUMN wifi_name VARCHAR(100) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) properties.wifi_password
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'wifi_password'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE properties ADD COLUMN wifi_password VARCHAR(100) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5) properties.door_code
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'properties' AND column_name = 'door_code'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE properties ADD COLUMN door_code VARCHAR(50) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 6) bookings.display_currency
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = 'display_currency'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN display_currency VARCHAR(3) DEFAULT NULL AFTER currency',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) users.auto_reply_enabled
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'auto_reply_enabled'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN auto_reply_enabled TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) users.auto_reply_message
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'auto_reply_message'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN auto_reply_message VARCHAR(500) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 5) users.fcm_token
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'fcm_token'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN fcm_token VARCHAR(500) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
