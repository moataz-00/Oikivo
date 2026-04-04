-- migration_042: Remove consultation_services from booking flow
-- Makes service_id nullable, adds delivery_mode to consultation_bookings

-- Step 1: Drop the FK constraint on service_id
ALTER TABLE consultation_bookings DROP FOREIGN KEY fk_cb_service;

-- Step 2: Make service_id nullable
ALTER TABLE consultation_bookings
  MODIFY COLUMN service_id BIGINT UNSIGNED NULL;

-- Step 3: Add delivery_mode column (video_call is default)
ALTER TABLE consultation_bookings
  ADD COLUMN delivery_mode ENUM('video_call', 'phone', 'in_person', 'chat')
  NOT NULL DEFAULT 'video_call'
  AFTER consultant_note;
