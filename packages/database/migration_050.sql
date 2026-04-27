-- migration_050: Create blocked_users and user_reports tables (DB-01, DB-02)
-- Also drops dead login_attempts table (DB-11)

-- ─── DB-01: blocked_users ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `blocked_users` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `blocker_id` bigint(20) UNSIGNED NOT NULL,
  `blocked_user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_block` (`blocker_id`, `blocked_user_id`),
  KEY `idx_blocker` (`blocker_id`),
  KEY `idx_blocked` (`blocked_user_id`),
  CONSTRAINT `fk_blocked_users_blocker` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_blocked_users_blocked` FOREIGN KEY (`blocked_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── DB-02: user_reports ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `user_reports` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `reporter_id` bigint(20) UNSIGNED NOT NULL,
  `reported_user_id` bigint(20) UNSIGNED NOT NULL,
  `report_type` enum('spam','harassment','inappropriate','fraud','other') NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `reviewed_by_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reporter` (`reporter_id`),
  KEY `idx_reported` (`reported_user_id`),
  KEY `idx_report_status` (`status`),
  CONSTRAINT `fk_user_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_reports_reported` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── DB-11: Drop dead login_attempts table ─────────────────────────────────────
-- The login_attempts table is never written to — nothing INSERTs into it.
-- The actual lockout logic uses users.failed_login_attempts and users.locked_until columns.
-- Only scheduler.service.ts purges it, but the table is always empty. Dead schema.

DROP TABLE IF EXISTS `login_attempts`;
