-- Migration 053: Track highest wizard step reached per listing
-- Allows verify page to gate checks to only steps the host has actually completed

ALTER TABLE `properties`
  ADD COLUMN `wizard_last_step` INT NOT NULL DEFAULT 0
    COMMENT 'Highest wizard step saved for this listing (0 = legacy/unknown)';
