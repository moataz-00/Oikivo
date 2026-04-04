-- Migration 029: Add impression_count to properties
-- Tracks how many times a property appeared in search results

ALTER TABLE properties
  ADD COLUMN impression_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER view_count;
