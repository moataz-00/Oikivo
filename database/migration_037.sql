-- Migration 037: Normalize all earnings and payouts currency to EGP
-- Run after migration_036.sql

UPDATE earnings SET currency = 'EGP' WHERE currency != 'EGP';
UPDATE payouts  SET currency = 'EGP' WHERE currency != 'EGP';

