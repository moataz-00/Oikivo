-- migration_061_host_policy_payout_automation.sql
-- Scope: HM1/HL2/PAY-H2/PAY-H4 support (host policy & payout automation)

-- 1) Payout storage hardening/support fields
SET @payouts_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'payouts'
);

SET @account_details_type := (
  SELECT DATA_TYPE
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'payouts' AND column_name = 'account_details'
  LIMIT 1
);
SET @sql := IF(
  @payouts_exists = 1 AND @account_details_type IS NOT NULL AND @account_details_type <> 'text',
  'ALTER TABLE payouts MODIFY COLUMN account_details TEXT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @is_auto_exists := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'payouts' AND column_name = 'is_auto'
);
SET @sql := IF(
  @payouts_exists = 1 AND @is_auto_exists = 0,
  'ALTER TABLE payouts ADD COLUMN is_auto TINYINT(1) NOT NULL DEFAULT 0 AFTER account_details',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Host auto payout preferences on users table
SET @users_exists := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'users'
);

SET @auto_enabled_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'auto_payout_enabled'
);
SET @sql := IF(
  @users_exists = 1 AND @auto_enabled_exists = 0,
  'ALTER TABLE users ADD COLUMN auto_payout_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER last_host_cancellation_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @auto_freq_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'auto_payout_frequency'
);
SET @sql := IF(
  @users_exists = 1 AND @auto_freq_exists = 0,
  'ALTER TABLE users ADD COLUMN auto_payout_frequency ENUM(''weekly'',''monthly'') NOT NULL DEFAULT ''weekly'' AFTER auto_payout_enabled',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @auto_day_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'auto_payout_day'
);
SET @sql := IF(
  @users_exists = 1 AND @auto_day_exists = 0,
  'ALTER TABLE users ADD COLUMN auto_payout_day TINYINT UNSIGNED NULL AFTER auto_payout_frequency',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @auto_min_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'auto_payout_min_balance'
);
SET @sql := IF(
  @users_exists = 1 AND @auto_min_exists = 0,
  'ALTER TABLE users ADD COLUMN auto_payout_min_balance DECIMAL(10,2) NOT NULL DEFAULT 100.00 AFTER auto_payout_day',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @auto_method_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'auto_payout_method'
);
SET @sql := IF(
  @users_exists = 1 AND @auto_method_exists = 0,
  'ALTER TABLE users ADD COLUMN auto_payout_method ENUM(''instapay'',''bank_transfer'',''cash'') NOT NULL DEFAULT ''instapay'' AFTER auto_payout_min_balance',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @auto_account_exists := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'auto_payout_account_details'
);
SET @sql := IF(
  @users_exists = 1 AND @auto_account_exists = 0,
  'ALTER TABLE users ADD COLUMN auto_payout_account_details TEXT NULL AFTER auto_payout_method',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


