-- ============================================================
-- Migration 044 — iCal / Channel Manager integration
-- ============================================================

-- 1. Add source column to property_availability so iCal-blocked
--    dates are distinguishable from host-blocked and booking-blocked dates.
ALTER TABLE property_availability
  ADD COLUMN IF NOT EXISTS source ENUM('host', 'ical', 'booking') NOT NULL DEFAULT 'host'
  AFTER price_override;

-- 2. Create the table that stores external iCal feed URLs per property.
CREATE TABLE IF NOT EXISTS property_ical_sources (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id   BIGINT UNSIGNED NOT NULL,
  label         VARCHAR(100)    NOT NULL,
  url           TEXT            NOT NULL,
  sync_status   ENUM('idle','syncing','success','error') NOT NULL DEFAULT 'idle',
  last_synced_at DATETIME       NULL,
  error_message TEXT            NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_ical_property (property_id),
  CONSTRAINT fk_ical_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
