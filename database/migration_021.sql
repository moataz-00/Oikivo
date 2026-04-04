-- migration_021: Add booking_uuid to bookings for secure URL referencing
USE sakan_db;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_uuid VARCHAR(36) NULL AFTER id;
UPDATE bookings SET booking_uuid = UUID() WHERE booking_uuid IS NULL;
ALTER TABLE bookings MODIFY COLUMN booking_uuid VARCHAR(36) NOT NULL;

-- Add unique index only if it doesn't already exist
SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings'
    AND INDEX_NAME = 'idx_bookings_booking_uuid'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE bookings ADD UNIQUE INDEX idx_bookings_booking_uuid (booking_uuid)',
  'SELECT ''Index idx_bookings_booking_uuid already exists, skipping.'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
