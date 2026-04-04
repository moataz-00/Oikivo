-- ============================================================
-- Sakan (Ø³ÙƒÙ†) â€” Full Database Schema
-- Database: sakan_db (MySQL / MariaDB)
-- ============================================================

CREATE DATABASE IF NOT EXISTS sakan_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sakan_db;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255),                          -- null for OAuth-only users
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  avatar_url      VARCHAR(500),
  phone           VARCHAR(30),
  bio             TEXT,
  date_of_birth   DATE,
  is_host         TINYINT(1) NOT NULL DEFAULT 0,
  is_superhost    TINYINT(1) NOT NULL DEFAULT 0,
  is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_phone_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_id_verified  TINYINT(1) NOT NULL DEFAULT 0,
  is_admin        TINYINT(1) NOT NULL DEFAULT 0,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  preferred_language ENUM('en','ar') NOT NULL DEFAULT 'en',
  google_id       VARCHAR(255),
  refresh_token   TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_users_email (email),
  KEY idx_users_google (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CATEGORIES (Beach, Mountain, Cabin, Pool, City, etc.)
-- ============================================================
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  name_ar     VARCHAR(100) NOT NULL,
  icon        VARCHAR(100) NOT NULL,            -- icon name or emoji
  description VARCHAR(255),
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AMENITIES
-- ============================================================
CREATE TABLE amenities (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  name_ar     VARCHAR(100) NOT NULL,
  icon        VARCHAR(100) NOT NULL,
  category    ENUM('essential','standout','safety') NOT NULL DEFAULT 'essential',
  sort_order  INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE properties (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  host_id             BIGINT UNSIGNED NOT NULL,
  category_id         INT UNSIGNED,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  space_type          ENUM('entire_place','private_room','shared_room') NOT NULL DEFAULT 'entire_place',
  property_kind       VARCHAR(100) NOT NULL DEFAULT 'apartment',   -- house, apartment, villa, cabin, etc.
  price_per_night     DECIMAL(10,2) NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',
  cleaning_fee        DECIMAL(10,2) NOT NULL DEFAULT 0,
  service_fee_percent DECIMAL(5,2) NOT NULL DEFAULT 14.00,
  min_nights          INT NOT NULL DEFAULT 1,
  max_nights          INT NOT NULL DEFAULT 365,
  max_guests          INT NOT NULL DEFAULT 1,
  bedrooms            INT NOT NULL DEFAULT 0,
  bathrooms           DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  beds                INT NOT NULL DEFAULT 1,
  -- Location
  address             VARCHAR(500),
  city                VARCHAR(150),
  state               VARCHAR(150),
  country             VARCHAR(150),
  country_code        CHAR(2),
  postal_code         VARCHAR(20),
  latitude            DECIMAL(10,7),
  longitude           DECIMAL(10,7),
  -- Rules
  check_in_after      TIME NOT NULL DEFAULT '15:00:00',
  check_out_before    TIME NOT NULL DEFAULT '11:00:00',
  allows_pets         TINYINT(1) NOT NULL DEFAULT 0,
  allows_smoking      TINYINT(1) NOT NULL DEFAULT 0,
  allows_parties      TINYINT(1) NOT NULL DEFAULT 0,
  allows_children     TINYINT(1) NOT NULL DEFAULT 1,
  -- Settings
  instant_book        TINYINT(1) NOT NULL DEFAULT 0,
  cancellation_policy ENUM('flexible','moderate','strict') NOT NULL DEFAULT 'flexible',
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  status              ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  -- Stats (denormalized for performance)
  avg_rating          DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count        INT NOT NULL DEFAULT 0,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  KEY idx_properties_host (host_id),
  KEY idx_properties_status (status),
  KEY idx_properties_location (latitude, longitude),
  KEY idx_properties_price (price_per_night),
  KEY idx_properties_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROPERTY PHOTOS
-- ============================================================
CREATE TABLE property_photos (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id   BIGINT UNSIGNED NOT NULL,
  url           VARCHAR(500) NOT NULL,
  caption       VARCHAR(255),
  display_order INT NOT NULL DEFAULT 0,
  is_cover      TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  KEY idx_photos_property (property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROPERTY AMENITIES (join table)
-- ============================================================
CREATE TABLE property_amenities (
  property_id   BIGINT UNSIGNED NOT NULL,
  amenity_id    INT UNSIGNED NOT NULL,
  PRIMARY KEY (property_id, amenity_id),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id)  REFERENCES amenities(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROPERTY HOUSE RULES
-- ============================================================
CREATE TABLE property_house_rules (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,
  rule        VARCHAR(500) NOT NULL,
  rule_ar     VARCHAR(500),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROPERTY AVAILABILITY
-- one row per date; if no row â€” date is available at base price
-- ============================================================
CREATE TABLE property_availability (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id    BIGINT UNSIGNED NOT NULL,
  date           DATE NOT NULL,
  is_blocked     TINYINT(1) NOT NULL DEFAULT 0,
  price_override DECIMAL(10,2),                    -- null = use base price
  UNIQUE KEY uk_availability (property_id, date),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id         BIGINT UNSIGNED NOT NULL,
  guest_id            BIGINT UNSIGNED NOT NULL,
  host_id             BIGINT UNSIGNED NOT NULL,
  check_in            DATE NOT NULL,
  check_out           DATE NOT NULL,
  guests_count        INT NOT NULL DEFAULT 1,
  nights              INT NOT NULL DEFAULT 1,
  base_amount         DECIMAL(10,2) NOT NULL,
  cleaning_fee        DECIMAL(10,2) NOT NULL DEFAULT 0,
  service_fee         DECIMAL(10,2) NOT NULL DEFAULT 0,
  taxes               DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount        DECIMAL(10,2) NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'USD',
  status              ENUM('pending','confirmed','completed','cancelled','declined') NOT NULL DEFAULT 'pending',
  payment_status      ENUM('pending','submitted','paid','refunded') NOT NULL DEFAULT 'pending',
  payment_method      ENUM('instapay','cash','card') NULL,
  payment_reference   VARCHAR(100) NULL,
  payment_note        TEXT NULL,
  cancellation_reason TEXT,
  cancellation_policy ENUM('flexible','moderate','strict') NULL COMMENT 'Snapshot of property policy at booking time',
  refund_amount       DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Amount refunded to guest',
  cancellation_fee    DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Fee retained',
  cancelled_at        DATETIME NULL COMMENT 'Exact timestamp of cancellation',
  cancelled_by        ENUM('guest','host','admin','system') NULL COMMENT 'Who initiated the cancellation',
  guest_note          TEXT,
  special_requests    TEXT,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (host_id)     REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_bookings_guest    (guest_id),
  KEY idx_bookings_host     (host_id),
  KEY idx_bookings_property (property_id),
  KEY idx_bookings_status   (status),
  KEY idx_bookings_dates    (check_in, check_out)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id            BIGINT UNSIGNED NOT NULL UNIQUE,
  reviewer_id           BIGINT UNSIGNED NOT NULL,
  property_id           BIGINT UNSIGNED NOT NULL,
  overall_rating        TINYINT UNSIGNED NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  cleanliness_rating    TINYINT UNSIGNED CHECK (cleanliness_rating BETWEEN 1 AND 5),
  accuracy_rating       TINYINT UNSIGNED CHECK (accuracy_rating BETWEEN 1 AND 5),
  communication_rating  TINYINT UNSIGNED CHECK (communication_rating BETWEEN 1 AND 5),
  location_rating       TINYINT UNSIGNED CHECK (location_rating BETWEEN 1 AND 5),
  value_rating          TINYINT UNSIGNED CHECK (value_rating BETWEEN 1 AND 5),
  checkin_rating        TINYINT UNSIGNED CHECK (checkin_rating BETWEEN 1 AND 5),
  comment               TEXT,
  host_reply            TEXT,
  host_replied_at       DATETIME,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id)   REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id)  REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (property_id)  REFERENCES properties(id) ON DELETE CASCADE,
  KEY idx_reviews_property (property_id),
  KEY idx_reviews_reviewer (reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
CREATE TABLE conversations (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED,
  booking_id  BIGINT UNSIGNED,
  host_id     BIGINT UNSIGNED NOT NULL,
  guest_id    BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (booking_id)  REFERENCES bookings(id)   ON DELETE SET NULL,
  FOREIGN KEY (host_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (guest_id)    REFERENCES users(id)      ON DELETE CASCADE,
  KEY idx_conversations_host  (host_id),
  KEY idx_conversations_guest (guest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_id       BIGINT UNSIGNED NOT NULL,
  body            TEXT NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE,
  KEY idx_messages_conversation (conversation_id),
  KEY idx_messages_sender       (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WISHLISTS
-- ============================================================
CREATE TABLE wishlists (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL DEFAULT 'Wishlist',
  visibility  ENUM('private','public') NOT NULL DEFAULT 'private',
  cover_photo VARCHAR(500),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_wishlists_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlist_items (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  wishlist_id BIGINT UNSIGNED NOT NULL,
  property_id BIGINT UNSIGNED NOT NULL,
  added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_wishlist_item (wishlist_id, property_id),
  FOREIGN KEY (wishlist_id) REFERENCES wishlists(id)   ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       VARCHAR(60) NOT NULL,              -- booking_confirmed, new_message, review_received ...
  title      VARCHAR(255) NOT NULL,
  title_ar   VARCHAR(255),
  body       TEXT NOT NULL,
  body_ar    TEXT,
  data_json  JSON,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CO-HOSTS
-- ============================================================
CREATE TABLE cohosts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  property_id BIGINT UNSIGNED NOT NULL,
  host_id     BIGINT UNSIGNED NOT NULL,          -- owner
  cohost_id   BIGINT UNSIGNED NOT NULL,          -- invited co-host
  role        ENUM('co_host','cleaner') NOT NULL DEFAULT 'co_host',
  status      ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cohost (property_id, cohost_id),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (host_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (cohost_id)   REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================
CREATE TABLE password_resets (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_password_resets_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VERIFICATION TOKENS (email + phone)
-- ============================================================
CREATE TABLE verification_tokens (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       ENUM('email','phone') NOT NULL DEFAULT 'email',
  token      VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_verification_tokens_user_type (user_id, type),
  KEY idx_verification_tokens_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EARNINGS (per-booking host earnings ledger)
-- ============================================================
CREATE TABLE earnings (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  host_id       BIGINT UNSIGNED NOT NULL,
  booking_id    BIGINT UNSIGNED NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  platform_fee  DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency      CHAR(3) NOT NULL DEFAULT 'EGP',
  status        ENUM('pending','available','paid') NOT NULL DEFAULT 'pending',
  available_at  DATETIME,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_earnings_booking (booking_id),
  FOREIGN KEY (host_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  KEY idx_earnings_host   (host_id),
  KEY idx_earnings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PAYOUTS (host payout requests)
-- ============================================================
CREATE TABLE payouts (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  host_id         BIGINT UNSIGNED NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'EGP',
  method          ENUM('instapay','bank_transfer','cash') NOT NULL DEFAULT 'instapay',
  account_details VARCHAR(500),
  status          ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  note            TEXT,
  processed_at    DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_payouts_host   (host_id),
  KEY idx_payouts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

