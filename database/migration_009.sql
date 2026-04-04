-- Migration 009: Identity document upload support
-- Adds id_document_url and id_verification_status to users table

ALTER TABLE users
  ADD COLUMN id_document_url VARCHAR(500) NULL
    COMMENT 'Path to uploaded government ID document'
    AFTER is_id_verified,
  ADD COLUMN id_verification_status ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none'
    COMMENT 'Current state of government ID verification'
    AFTER id_document_url;
