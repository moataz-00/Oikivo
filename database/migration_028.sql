-- migration_028: Add 'in_progress' to bookings.status enum
-- Required for feature 5.2: mid-stay status tracking

ALTER TABLE bookings
  MODIFY COLUMN status ENUM('pending','confirmed','in_progress','completed','cancelled','declined')
  NOT NULL DEFAULT 'pending';
