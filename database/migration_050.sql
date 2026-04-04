-- Migration 050: G4, G5, G6, G7, G9, X14
-- Adds review photos, saved searches, wishlist share token,
-- user notification preferences, booking short code, and fixes currency default.

-- G4: Review photos (JSON array of URL strings)
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS photos JSON NULL AFTER comment;

-- G5: Saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL,
  filters     JSON         NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_saved_searches_user (user_id),
  CONSTRAINT fk_saved_searches_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- G6: Wishlist share token
ALTER TABLE wishlists
  ADD COLUMN IF NOT EXISTS share_token VARCHAR(36) NULL AFTER visibility,
  ADD UNIQUE INDEX IF NOT EXISTS uidx_wishlists_share_token (share_token);

-- Backfill share tokens for existing rows (MySQL 8.0+)
UPDATE wishlists
SET share_token = UUID()
WHERE share_token IS NULL;

-- G7: User notification preferences (JSON, null = all enabled)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_preferences JSON NULL AFTER last_profile_edit_at;

-- G9: Booking short code (human-readable, e.g. STAY-1A2B)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS short_code VARCHAR(12) NULL AFTER booking_uuid;

-- X14: Currency default fix — update existing NULL/USD rows to EGP (optional data fix)
-- ALTER TABLE bookings MODIFY COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'EGP';
-- (Run separately if you want to modify the column definition; safe to skip if using ORM defaults)
