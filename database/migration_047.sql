-- migration_047: Consultant payout infrastructure (C12)
-- Creates consultant_earnings and consultant_payout_requests tables,
-- and adds payout_method / payout_account_details columns to consultants.

CREATE TABLE IF NOT EXISTS `consultant_earnings` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `consultant_id` BIGINT UNSIGNED NOT NULL,
  `booking_id`   BIGINT UNSIGNED NOT NULL,
  `amount`       DECIMAL(10,2)   NOT NULL,
  `platform_fee` DECIMAL(10,2)   NOT NULL DEFAULT 0,
  `currency`     CHAR(3)         NOT NULL DEFAULT 'EGP',
  `status`       ENUM('hold','available','paid','refunded') NOT NULL DEFAULT 'hold',
  `available_at` DATETIME        NULL,
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ce_consultant` FOREIGN KEY (`consultant_id`) REFERENCES `consultants`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ce_booking`    FOREIGN KEY (`booking_id`)    REFERENCES `consultation_bookings`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_ce_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `consultant_payout_requests` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `consultant_id`   BIGINT UNSIGNED NOT NULL,
  `amount`          DECIMAL(10,2)   NOT NULL,
  `currency`        CHAR(3)         NOT NULL DEFAULT 'EGP',
  `method`          ENUM('instapay','bank_transfer') NOT NULL DEFAULT 'instapay',
  `account_details` VARCHAR(500)    NULL,
  `status`          ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `note`            TEXT            NULL,
  `processed_at`    DATETIME        NULL,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cpr_consultant` FOREIGN KEY (`consultant_id`) REFERENCES `consultants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add payout preference columns to consultants
ALTER TABLE `consultants`
  ADD COLUMN IF NOT EXISTS `payout_method`          ENUM('instapay','bank_transfer') NULL AFTER `timezone`,
  ADD COLUMN IF NOT EXISTS `payout_account_details` VARCHAR(300)                    NULL AFTER `payout_method`;
