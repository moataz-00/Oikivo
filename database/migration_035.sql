-- ============================================================
-- Migration 035 — SPATIAL INDEX for nearbyProperties (MariaDB)
-- ============================================================
-- MariaDB does NOT support SPATIAL/POINT types as generated
-- (VIRTUAL/PERSISTENT) columns (MDEV-17505).  So instead:
--
--   1. Add a regular (non-generated) POINT column  geo_point.
--   2. Back-fill it from existing latitude / longitude values.
--   3. Make it NOT NULL (required for SPATIAL INDEX in MariaDB).
--   4. Create SPATIAL INDEX  idx_properties_geo_point.
--   5. Add BEFORE INSERT + BEFORE UPDATE triggers so MariaDB keeps
--      geo_point in sync automatically whenever lat/lng changes.
--
-- search.service.ts then uses:
--   MBRWithin(p.geo_point, ST_GeomFromText(?))   ← hits spatial index
--      + Haversine exact-distance guard           ← MariaDB-compatible
--
-- Run this file once against the live database.
-- ============================================================

-- Step 1: add nullable column first (so existing rows don't violate NOT NULL)
ALTER TABLE properties
  ADD COLUMN geo_point POINT;

-- Step 2: back-fill — valid rows get POINT(longitude, latitude),
--         NULL lat/lng rows get sentinel POINT(0, 0).
--         Queries always filter AND p.latitude IS NOT NULL so the
--         sentinel is never returned to callers.
UPDATE properties
SET geo_point = POINT(IFNULL(longitude, 0), IFNULL(latitude, 0));

-- Step 3: lock down to NOT NULL (required for SPATIAL INDEX)
ALTER TABLE properties
  MODIFY COLUMN geo_point POINT NOT NULL;

-- Step 4: SPATIAL INDEX
CREATE SPATIAL INDEX idx_properties_geo_point ON properties (geo_point);

-- Step 5a: keep geo_point in sync on INSERT
CREATE TRIGGER trg_properties_geo_before_insert
BEFORE INSERT ON properties
FOR EACH ROW
  SET NEW.geo_point = POINT(IFNULL(NEW.longitude, 0), IFNULL(NEW.latitude, 0));

-- Step 5b: keep geo_point in sync on UPDATE
CREATE TRIGGER trg_properties_geo_before_update
BEFORE UPDATE ON properties
FOR EACH ROW
  SET NEW.geo_point = POINT(IFNULL(NEW.longitude, 0), IFNULL(NEW.latitude, 0));
