-- migration_057: Add completed_at timestamp to bookings
ALTER TABLE bookings
  ADD COLUMN completed_at DATETIME NULL
    COMMENT 'Set when booking is marked completed (by scheduler or manually)'
    AFTER confirmed_at;
