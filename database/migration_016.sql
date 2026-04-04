-- Migration 016: Platform Settings
-- Stores configurable key-value settings such as service fee percentages

CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key`         VARCHAR(100) NOT NULL,
  `value`       VARCHAR(255) NOT NULL DEFAULT '',
  `description` VARCHAR(500) DEFAULT NULL,
  `updated_at`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_platform_settings_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default fee values
INSERT INTO `platform_settings` (`key`, `value`, `description`) VALUES
  ('property_guest_fee_pct',    '14', 'Guest service fee % charged on top of property booking subtotal'),
  ('property_host_fee_pct',     '3',  'Host commission % deducted from property booking payout'),
  ('experience_guest_fee_pct',  '10', 'Guest service fee % charged on top of experience booking subtotal'),
  ('experience_host_fee_pct',   '5',  'Host commission % deducted from experience booking payout')
ON DUPLICATE KEY UPDATE `id` = `id`;
