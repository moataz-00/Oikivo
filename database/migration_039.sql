-- ============================================================
-- Migration 039 — Consultation Marketplace
-- ============================================================
-- Qualified hosts can offer paid hospitality consultation sessions
-- to unqualified / struggling hosts. The platform takes a 10% cut.
--
-- Tables:
--   1. consultants            — approved consultant profiles
--   2. consultation_services  — services a consultant offers
--   3. consultation_bookings  — booked sessions
--   4. consultation_reviews   — reviews left after sessions
--   5. consultant_documents   — uploaded proof docs (certificates, etc.)
--   6. consultant_availability — weekly time slots
-- ============================================================

-- ─── 1. Consultants ─────────────────────────────────────────

CREATE TABLE consultants (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid            CHAR(36) NOT NULL UNIQUE,
  user_id         BIGINT UNSIGNED NOT NULL,
  display_name    VARCHAR(120) NOT NULL,
  bio             TEXT,
  specializations JSON COMMENT '["pricing","interior_design","guest_experience","listing_optimization","photography","superhost_coaching","multi-property_management"]',
  years_experience TINYINT UNSIGNED NOT NULL DEFAULT 0,
  languages       JSON COMMENT '["en","ar"]',
  hourly_rate     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
  avg_rating      DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count    INT UNSIGNED NOT NULL DEFAULT 0,
  total_sessions  INT UNSIGNED NOT NULL DEFAULT 0,
  status          ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  approved_at     DATETIME,
  is_featured     TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_consultants_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_consultants_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consultants_status ON consultants (status);
CREATE INDEX idx_consultants_rating ON consultants (avg_rating DESC, review_count DESC);
CREATE INDEX idx_consultants_featured ON consultants (is_featured, status);

-- ─── 2. Consultant Documents ────────────────────────────────

CREATE TABLE consultant_documents (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consultant_id   BIGINT UNSIGNED NOT NULL,
  document_type   ENUM('hospitality_certificate','business_license','superhost_proof','portfolio','other') NOT NULL,
  file_url        VARCHAR(500) NOT NULL,
  original_name   VARCHAR(255),
  status          ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_note      TEXT,
  uploaded_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_consultant_docs_consultant FOREIGN KEY (consultant_id)
    REFERENCES consultants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 3. Consultation Services ───────────────────────────────

CREATE TABLE consultation_services (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid            CHAR(36) NOT NULL UNIQUE,
  consultant_id   BIGINT UNSIGNED NOT NULL,
  title           VARCHAR(200) NOT NULL,
  title_ar        VARCHAR(200),
  description     TEXT,
  description_ar  TEXT,
  category        ENUM(
    'listing_optimization',
    'pricing_strategy',
    'interior_design',
    'guest_experience',
    'photography',
    'superhost_coaching',
    'property_management',
    'legal_compliance',
    'marketing',
    'revenue_management',
    'general'
  ) NOT NULL DEFAULT 'general',
  duration_minutes INT UNSIGNED NOT NULL DEFAULT 60,
  price           DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
  delivery_mode   ENUM('video_call','in_person','phone','chat') NOT NULL DEFAULT 'video_call',
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  max_bookings_per_day TINYINT UNSIGNED NOT NULL DEFAULT 5,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_consultation_services_consultant FOREIGN KEY (consultant_id)
    REFERENCES consultants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_consultation_services_category ON consultation_services (category, is_active);
CREATE INDEX idx_consultation_services_consultant ON consultation_services (consultant_id, is_active);

-- ─── 4. Consultation Bookings ───────────────────────────────

CREATE TABLE consultation_bookings (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid            CHAR(36) NOT NULL UNIQUE,
  service_id      BIGINT UNSIGNED NOT NULL,
  consultant_id   BIGINT UNSIGNED NOT NULL,
  client_id       BIGINT UNSIGNED NOT NULL COMMENT 'The host seeking help',
  scheduled_at    DATETIME NOT NULL,
  duration_minutes INT UNSIGNED NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  platform_fee    DECIMAL(10,2) NOT NULL COMMENT '10% platform cut',
  consultant_payout DECIMAL(10,2) NOT NULL COMMENT '90% to consultant',
  currency        VARCHAR(3) NOT NULL DEFAULT 'EGP',
  status          ENUM('pending','confirmed','in_progress','completed','cancelled','no_show','disputed') NOT NULL DEFAULT 'pending',
  payment_status  ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
  payment_method  ENUM('card','instapay','wallet') NOT NULL DEFAULT 'card',
  meeting_link    VARCHAR(500),
  client_note     TEXT,
  consultant_note TEXT,
  cancellation_reason TEXT,
  cancelled_by    ENUM('client','consultant','admin'),
  completed_at    DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_cb_service FOREIGN KEY (service_id)
    REFERENCES consultation_services(id) ON DELETE CASCADE,
  CONSTRAINT fk_cb_consultant FOREIGN KEY (consultant_id)
    REFERENCES consultants(id) ON DELETE CASCADE,
  CONSTRAINT fk_cb_client FOREIGN KEY (client_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cb_consultant_date ON consultation_bookings (consultant_id, scheduled_at);
CREATE INDEX idx_cb_client ON consultation_bookings (client_id, status);
CREATE INDEX idx_cb_status ON consultation_bookings (status);

-- ─── 5. Consultation Reviews ────────────────────────────────

CREATE TABLE consultation_reviews (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id      BIGINT UNSIGNED NOT NULL,
  reviewer_id     BIGINT UNSIGNED NOT NULL COMMENT 'The client leaving the review',
  consultant_id   BIGINT UNSIGNED NOT NULL,
  overall_rating  TINYINT UNSIGNED NOT NULL COMMENT '1-5',
  expertise_rating TINYINT UNSIGNED,
  communication_rating TINYINT UNSIGNED,
  value_rating    TINYINT UNSIGNED,
  comment         TEXT,
  consultant_reply TEXT,
  consultant_replied_at DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_cr_booking FOREIGN KEY (booking_id)
    REFERENCES consultation_bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_cr_reviewer FOREIGN KEY (reviewer_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cr_consultant FOREIGN KEY (consultant_id)
    REFERENCES consultants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cr_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cr_consultant ON consultation_reviews (consultant_id, overall_rating);

-- ─── 6. Consultant Availability ─────────────────────────────

CREATE TABLE consultant_availability (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consultant_id   BIGINT UNSIGNED NOT NULL,
  day_of_week     TINYINT UNSIGNED NOT NULL COMMENT '0=Sun..6=Sat',
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,

  CONSTRAINT fk_ca_consultant FOREIGN KEY (consultant_id)
    REFERENCES consultants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ca_consultant_day ON consultant_availability (consultant_id, day_of_week);

-- ─── Triggers: auto-update avg_rating on consultation_reviews ─────────

DELIMITER $$

CREATE TRIGGER trg_consultation_review_insert
AFTER INSERT ON consultation_reviews
FOR EACH ROW
BEGIN
  UPDATE consultants SET
    avg_rating = (
      SELECT COALESCE(AVG(overall_rating), 0) FROM consultation_reviews WHERE consultant_id = NEW.consultant_id
    ),
    review_count = (
      SELECT COUNT(*) FROM consultation_reviews WHERE consultant_id = NEW.consultant_id
    )
  WHERE id = NEW.consultant_id;
END $$

DELIMITER ;
