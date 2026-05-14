-- Migration 067: Add deleted_at to users (soft-delete support)
-- Hard-deleting a user fails with FK constraint errors because
-- bookings.guest_id / bookings.host_id reference users(id) without CASCADE.
-- Preserving booking/payment audit history is required, so we soft-delete:
-- anonymize PII, set is_active = false, and stamp deleted_at.

ALTER TABLE `users`
  ADD COLUMN `deleted_at` DATETIME NULL DEFAULT NULL
    COMMENT 'Non-null = account soft-deleted; PII anonymized, login blocked'
  AFTER `updated_at`;
