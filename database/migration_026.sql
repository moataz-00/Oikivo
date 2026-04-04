-- Migration 026: Add pending_review to properties status enum
-- Property publish flow now sets status = 'pending_review' for admin moderation,
-- instead of going live immediately.

ALTER TABLE properties
  MODIFY COLUMN status ENUM('draft', 'pending_review', 'published', 'archived')
    NOT NULL DEFAULT 'draft';
