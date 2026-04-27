-- migration_058: Support host-to-guest reviews
-- 1. Add reviewer_role to distinguish guest→property vs host→guest reviews
-- 2. Add reviewed_user_id so host reviews target a specific guest
-- 3. Update unique constraint from (booking_id) to (booking_id, reviewer_role)
--    so each booking can have one guest review + one host review

-- Add reviewer_role (safe: skip if already exists)
SET @col1 = (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'reviews' AND column_name = 'reviewer_role');
SET @sql1 = IF(@col1 = 0,
  "ALTER TABLE reviews ADD COLUMN reviewer_role ENUM('guest','host') NOT NULL DEFAULT 'guest' COMMENT 'guest = guest reviewing property; host = host reviewing guest' AFTER reviewer_id",
  'SELECT 1');
PREPARE s1 FROM @sql1; EXECUTE s1; DEALLOCATE PREPARE s1;

-- Add reviewed_user_id (safe: skip if already exists)
SET @col2 = (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'reviews' AND column_name = 'reviewed_user_id');
SET @sql2 = IF(@col2 = 0,
  'ALTER TABLE reviews ADD COLUMN reviewed_user_id BIGINT UNSIGNED NULL COMMENT \'Populated for host→guest reviews; the guest being reviewed\' AFTER reviewer_role',
  'SELECT 1');
PREPARE s2 FROM @sql2; EXECUTE s2; DEALLOCATE PREPARE s2;

-- Drop old unique constraint on booking_id alone (name varies by TypeORM version; try all known names)
SET @exists_REL = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'reviews' AND index_name = 'REL_booking_id');
SET @exists_UQ = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'reviews' AND index_name = 'UQ_booking_id');
SET @sql_REL = IF(@exists_REL > 0, 'ALTER TABLE reviews DROP INDEX `REL_booking_id`', 'SELECT 1');
SET @sql_UQ  = IF(@exists_UQ  > 0, 'ALTER TABLE reviews DROP INDEX `UQ_booking_id`',  'SELECT 1');
PREPARE stmt_REL FROM @sql_REL; EXECUTE stmt_REL; DEALLOCATE PREPARE stmt_REL;
PREPARE stmt_UQ  FROM @sql_UQ;  EXECUTE stmt_UQ;  DEALLOCATE PREPARE stmt_UQ;

-- New composite unique: one review per role per booking (safe: skip if already exists)
SET @exists_idx = (SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'reviews' AND index_name = 'idx_reviews_booking_role');
SET @sql_idx = IF(@exists_idx = 0,
  'ALTER TABLE reviews ADD UNIQUE INDEX idx_reviews_booking_role (booking_id, reviewer_role)',
  'SELECT 1');
PREPARE stmt_idx FROM @sql_idx; EXECUTE stmt_idx; DEALLOCATE PREPARE stmt_idx;

