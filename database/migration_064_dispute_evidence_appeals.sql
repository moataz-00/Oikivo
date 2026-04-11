-- Migration 064: Schema catch-up for G1–G17 feature columns + new tables
-- Covers: G1 (review edit/delete), G8 (saved search alerts), G13 (read receipts),
--         G17 (price alerts + price history), GW9/DISP-G2 (dispute evidence/appeals)
-- NOTE: Columns already present (from migration_062/063) are skipped.

-- ─── messages: G13 read receipts ─────────────────────────────────────────────
ALTER TABLE messages
  ADD COLUMN read_at DATETIME DEFAULT NULL AFTER is_read;

-- ─── reviews: G1 review editing / soft-delete ───────────────────────────────
-- NOTE: `photos` column already exists
ALTER TABLE reviews
  ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER photos,
  ADD COLUMN deleted_at DATETIME DEFAULT NULL AFTER is_deleted,
  ADD COLUMN deleted_by ENUM('admin','guest','host') DEFAULT NULL AFTER deleted_at;

-- ─── saved_searches: G8 saved search alerts ─────────────────────────────────
ALTER TABLE saved_searches
  ADD COLUMN alert_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER filters,
  ADD COLUMN last_alerted_at DATETIME DEFAULT NULL AFTER alert_enabled;

-- ─── price_alerts: G17 price drop notifications (new table) ─────────────────
CREATE TABLE IF NOT EXISTS price_alerts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  property_id BIGINT UNSIGNED NOT NULL,
  target_price DECIMAL(10,2) NOT NULL,
  last_known_price DECIMAL(10,2) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  notified_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_price_alerts_user (user_id),
  INDEX idx_price_alerts_property (property_id),
  CONSTRAINT fk_price_alerts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_price_alerts_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── property_price_history: price tracking for alerts ──────────────────────
CREATE TABLE IF NOT EXISTS property_price_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id BIGINT UNSIGNED NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_price_history_prop_date (property_id, recorded_at),
  CONSTRAINT fk_price_history_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
