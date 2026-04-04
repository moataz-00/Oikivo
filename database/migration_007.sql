-- Migration 007: Experiences feature
-- Experiences (activities/tours hosted by locals – like Airbnb Experiences)

-- ── Experience categories ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50) NULL,
  description TEXT NULL,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO experience_categories (name, slug, icon, description, display_order) VALUES
  ('Food & Drink', 'food-drink', '🍳', 'Cooking classes, food tours, and tastings', 1),
  ('Culture & History', 'culture-history', '🏛️', 'Historical tours, museum visits, and cultural immersions', 2),
  ('Nature & Outdoors', 'nature-outdoors', '🌿', 'Desert safaris, diving, hiking, and nature walks', 3),
  ('Art & Creativity', 'art-creativity', '🎨', 'Pottery, painting, calligraphy, and crafts', 4),
  ('Music & Dance', 'music-dance', '🎵', 'Traditional music, dance classes, and performances', 5),
  ('Sports & Wellness', 'sports-wellness', '🧘', 'Yoga, fitness, meditation, and sports', 6),
  ('Nightlife', 'nightlife', '🌙', 'Night tours, rooftop experiences, and evening events', 7),
  ('Shopping & Fashion', 'shopping-fashion', '🛍️', 'Market tours, bazaar experiences, and artisan workshops', 8),
  ('Photography', 'photography', '📸', 'Photo walks, portrait sessions, and scenic tours', 9),
  ('Social Impact', 'social-impact', '🤝', 'Community projects, volunteering, and social enterprises', 10);

-- ── Experiences ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experiences (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE,
  host_id BIGINT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  what_well_do TEXT NULL COMMENT 'What guests will experience',
  what_i_will_provide TEXT NULL COMMENT 'Items provided by host',
  guest_requirements TEXT NULL COMMENT 'Fitness level, age, etc.',
  language VARCHAR(50) DEFAULT 'English',
  duration_minutes INT NOT NULL DEFAULT 120 COMMENT 'Total duration in minutes',
  max_guests INT NOT NULL DEFAULT 10,
  min_guests INT NOT NULL DEFAULT 1,
  price_per_person DECIMAL(10,2) NOT NULL,
  group_discount_percent DECIMAL(5,2) DEFAULT 0 COMMENT 'Discount for 5+ guests',
  city VARCHAR(150) NOT NULL,
  address VARCHAR(500) NULL,
  country VARCHAR(150) DEFAULT 'Egypt',
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  meeting_point TEXT NULL COMMENT 'Where to meet guests',
  instant_book TINYINT(1) DEFAULT 0,
  status ENUM('draft','published','archived') DEFAULT 'draft',
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  total_bookings INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  archived_at TIMESTAMP NULL,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES experience_categories(id) ON DELETE SET NULL,
  INDEX idx_exp_host (host_id),
  INDEX idx_exp_status (status),
  INDEX idx_exp_city (city),
  INDEX idx_exp_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Experience photos ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_photos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  experience_id BIGINT UNSIGNED NOT NULL,
  url VARCHAR(500) NOT NULL,
  display_order INT DEFAULT 0,
  is_cover TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
  INDEX idx_exp_photo (experience_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Itinerary steps ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_itinerary (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  experience_id BIGINT UNSIGNED NOT NULL,
  step_number INT NOT NULL DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  duration_minutes INT NULL COMMENT 'Duration for this step',
  FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
  INDEX idx_exp_itinerary (experience_id),
  UNIQUE KEY uk_exp_step (experience_id, step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Experience bookings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  experience_id BIGINT UNSIGNED NOT NULL,
  guest_id BIGINT UNSIGNED NOT NULL,
  host_id BIGINT UNSIGNED NOT NULL,
  booking_date DATE NOT NULL COMMENT 'The date of the experience',
  start_time TIME NOT NULL COMMENT 'Start time of the session',
  guests_count INT NOT NULL DEFAULT 1,
  price_per_person DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL COMMENT 'price_per_person * guests_count',
  discount_amount DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0 COMMENT '14% guest service fee',
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','confirmed','completed','cancelled','declined') DEFAULT 'pending',
  payment_status ENUM('pending','submitted','paid','refunded') DEFAULT 'pending',
  payment_method ENUM('instapay','cash','card') NULL,
  payment_reference VARCHAR(255) NULL,
  guest_note TEXT NULL,
  cancellation_reason TEXT NULL,
  cancelled_at TIMESTAMP NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expb_experience (experience_id),
  INDEX idx_expb_guest (guest_id),
  INDEX idx_expb_host (host_id),
  INDEX idx_expb_date (booking_date),
  INDEX idx_expb_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Experience reviews ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_reviews (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL UNIQUE,
  reviewer_id BIGINT UNSIGNED NOT NULL,
  experience_id BIGINT UNSIGNED NOT NULL,
  overall_rating TINYINT UNSIGNED NOT NULL,
  host_rating TINYINT UNSIGNED NULL COMMENT 'How knowledgeable/engaging was the host',
  value_rating TINYINT UNSIGNED NULL COMMENT 'Was it worth the price',
  activity_rating TINYINT UNSIGNED NULL COMMENT 'How fun/engaging was the activity',
  comment TEXT NULL,
  host_reply TEXT NULL,
  host_replied_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES experience_bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
  INDEX idx_expr_experience (experience_id),
  INDEX idx_expr_reviewer (reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Experience availability schedule ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_schedule (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  experience_id BIGINT UNSIGNED NOT NULL,
  day_of_week TINYINT UNSIGNED NOT NULL COMMENT '0=Sun,1=Mon,...,6=Sat',
  start_time TIME NOT NULL,
  end_time TIME NULL,
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
  INDEX idx_exps_exp (experience_id),
  UNIQUE KEY uk_exps_slot (experience_id, day_of_week, start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Experience date overrides (block specific dates or add special dates) ──────
CREATE TABLE IF NOT EXISTS experience_date_overrides (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  experience_id BIGINT UNSIGNED NOT NULL,
  override_date DATE NOT NULL,
  is_blocked TINYINT(1) DEFAULT 0 COMMENT '1=blocked, 0=available with override_time',
  override_time TIME NULL,
  max_guests_override INT NULL,
  price_override DECIMAL(10,2) NULL,
  FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE,
  UNIQUE KEY uk_expdo (experience_id, override_date, override_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
