-- Migration 027: Add view_count column to properties table
-- Tracks the number of times a property's detail page has been viewed

ALTER TABLE properties
  ADD COLUMN view_count INT UNSIGNED NOT NULL DEFAULT 0
  AFTER review_count;
