-- Migration 046: Consultant vacation / out-of-office blocks
-- Stores date ranges during which a consultant is unavailable for bookings.

CREATE TABLE IF NOT EXISTS `consultant_vacation_blocks` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `consultant_id` BIGINT UNSIGNED NOT NULL,
  `start_date`    DATE            NOT NULL,
  `end_date`      DATE            NOT NULL,
  `reason`        VARCHAR(255)    NULL,
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_vacation_consultant` (`consultant_id`),
  CONSTRAINT `fk_vacation_block_consultant`
    FOREIGN KEY (`consultant_id`)
    REFERENCES `consultants` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
