-- migration_063_host_response_metrics.sql
-- Scope: H9 (host response time tracking on user profile)

-- 1) users.average_response_minutes
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'average_response_minutes'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN average_response_minutes DECIMAL(10,1) NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) users.response_rate
SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'response_rate'
);
SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN response_rate DECIMAL(5,2) NOT NULL DEFAULT 100.00',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
