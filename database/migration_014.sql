-- ============================================================
-- Migration 014: Ensure admin user has is_admin = 1
-- Fixes: admin login returning "Invalid credentials" /
--        "Access denied" because the seed INSERT omitted is_admin.
-- Run this against any existing database that was seeded before
-- this fix was applied.
-- ============================================================

USE sakan_db;

-- Grant admin flag and ensure email is verified for the seeded admin account
UPDATE users
SET    is_admin = 1,
       is_email_verified = 1,
       is_active = 1
WHERE  email = 'admin@sakan.app';

-- If the admin user was never seeded, insert them now
-- (password = "password123")
INSERT INTO users (email, password_hash, first_name, last_name, bio, is_host, is_admin, is_email_verified, preferred_language)
SELECT 'admin@sakan.app',
       '$2b$10$qhup6zWen75uuBiJICCb4.RUKGGU8pE91LjfZI/apirVgF.5I0Lm6',
       'Admin', 'Sakan',
       'Platform administrator',
       1, 1, 1, 'en'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@sakan.app'
);
