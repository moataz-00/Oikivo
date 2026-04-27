-- migration_056: Add uuid column to disputes for secure URL access
ALTER TABLE disputes ADD COLUMN uuid VARCHAR(36) NULL AFTER id;
UPDATE disputes SET uuid = UUID() WHERE uuid IS NULL;
ALTER TABLE disputes MODIFY COLUMN uuid VARCHAR(36) NOT NULL;
ALTER TABLE disputes ADD UNIQUE INDEX idx_disputes_uuid (uuid);
