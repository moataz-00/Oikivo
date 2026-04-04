-- ============================================================
-- Migration 041 — Security & Data Model fixes
-- (Consultation Audit: S1-S5, D1-D5)
-- ============================================================

-- D1: Store client timezone with consultation bookings
ALTER TABLE consultation_bookings
  ADD COLUMN IF NOT EXISTS client_timezone VARCHAR(50) NOT NULL DEFAULT 'UTC'
  AFTER consultant_payout;

-- D2: Store consultant's local timezone on their profile
ALTER TABLE consultants
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'UTC'
  AFTER is_featured;

-- D3: Prevent duplicate availability slots per consultant/day/time
-- MariaDB does not support ADD CONSTRAINT IF NOT EXISTS; use a prepared statement
SET @d3 = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'consultant_availability'
       AND CONSTRAINT_NAME = 'uq_consultant_day_start') = 0,
    'ALTER TABLE consultant_availability ADD CONSTRAINT uq_consultant_day_start UNIQUE (consultant_id, day_of_week, start_time)',
    'SELECT ''uq_consultant_day_start already exists, skipping'' AS info'
  )
);
PREPARE _d3 FROM @d3;
EXECUTE _d3;
DEALLOCATE PREPARE _d3;

-- D4: Allow admins to hide inappropriate consultation reviews
ALTER TABLE consultation_reviews
  ADD COLUMN IF NOT EXISTS is_hidden TINYINT(1) UNSIGNED NOT NULL DEFAULT 0
  AFTER consultant_replied_at;

-- D5 (verification): Ensure price columns are DECIMAL(10,2)
--   These were already DECIMAL in the entity; the statements below
--   are safe no-ops if the type is already correct.
ALTER TABLE consultation_bookings
  MODIFY COLUMN price            DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN platform_fee     DECIMAL(10,2) NOT NULL,
  MODIFY COLUMN consultant_payout DECIMAL(10,2) NOT NULL;

-- Document type enum expansion to match controller ALLOWED_DOC_TYPES
--   national_id and profile_photo were accepted by the controller but
--   not present in the DB enum — adding them now.
ALTER TABLE consultant_documents
  MODIFY COLUMN document_type ENUM(
    'hospitality_certificate',
    'business_license',
    'superhost_proof',
    'portfolio',
    'other',
    'national_id',
    'profile_photo'
  ) NOT NULL;
