-- migration_060_host_booking_hardening.sql
-- Align schema with host booking hardening updates.

-- 1) Add new booking note columns if missing.
SET @db_name := DATABASE();

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db_name
        AND table_name = 'bookings'
        AND column_name = 'host_note'
    ),
    'SELECT 1',
    'ALTER TABLE `bookings` ADD COLUMN `host_note` varchar(2000) NULL AFTER `guest_note`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db_name
        AND table_name = 'bookings'
        AND column_name = 'host_check_in_instructions'
    ),
    'SELECT 1',
    'ALTER TABLE `bookings` ADD COLUMN `host_check_in_instructions` text NULL AFTER `host_note`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Extend bookings.payment_status enum with refund_pending when missing.
SET @payment_status_type := (
  SELECT column_type
  FROM information_schema.columns
  WHERE table_schema = @db_name
    AND table_name = 'bookings'
    AND column_name = 'payment_status'
  LIMIT 1
);

SET @sql := (
  SELECT IF(
    @payment_status_type IS NULL,
    'SELECT 1',
    IF(
      LOCATE('''refund_pending''', @payment_status_type) > 0,
      'SELECT 1',
      'ALTER TABLE `bookings` MODIFY COLUMN `payment_status` enum(''pending'',''submitted'',''paid'',''refunded'',''declined'',''refund_pending'') NOT NULL DEFAULT ''pending'''
    )
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Add host cancellation tracking fields on users table if missing.
SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db_name
        AND table_name = 'users'
        AND column_name = 'host_cancelled_bookings_count'
    ),
    'SELECT 1',
    'ALTER TABLE `users` ADD COLUMN `host_cancelled_bookings_count` int UNSIGNED NOT NULL DEFAULT 0 AFTER `last_profile_edit_at`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = @db_name
        AND table_name = 'users'
        AND column_name = 'last_host_cancellation_at'
    ),
    'SELECT 1',
    'ALTER TABLE `users` ADD COLUMN `last_host_cancellation_at` datetime NULL AFTER `host_cancelled_bookings_count`'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
