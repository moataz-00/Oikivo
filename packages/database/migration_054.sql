-- migration_054: Add uuid column to wishlists table for secure URL identifiers
ALTER TABLE wishlists ADD COLUMN uuid VARCHAR(36) NULL AFTER id;
UPDATE wishlists SET uuid = UUID() WHERE uuid IS NULL;
ALTER TABLE wishlists MODIFY COLUMN uuid VARCHAR(36) NOT NULL;
ALTER TABLE wishlists ADD UNIQUE INDEX idx_wishlists_uuid (uuid);
