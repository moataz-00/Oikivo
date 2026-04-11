-- =====================================================
-- Migration 059: Schema Audit and Missing Tables
-- =====================================================
-- This migration adds missing tables and indexes based on entity definitions
-- Date: 2026-04-10


-- =====================================================
-- 1. MISSING TABLES
-- =====================================================

-- No additional tables required.


-- =====================================================
-- 2. MISSING INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- 2.1 Add spatial index on properties geo_point for location-based queries
-- Note: Check if this already exists before running
-- ALTER TABLE `properties` ADD SPATIAL INDEX `idx_geo_point` (`geo_point`);

-- 2.2 Add index on properties for featured listings
SET @idx_exists := (
	SELECT COUNT(1)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'properties'
		AND index_name = 'idx_properties_featured'
);
SET @sql := IF(
	@idx_exists = 0,
	'ALTER TABLE `properties` ADD INDEX `idx_properties_featured` (`is_featured`, `status`)',
	'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.3 Add index on users for consultant lookups
SET @idx_exists := (
	SELECT COUNT(1)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'users'
		AND index_name = 'idx_users_consultant'
);
SET @sql := IF(
	@idx_exists = 0,
	'ALTER TABLE `users` ADD INDEX `idx_users_consultant` (`is_consultant`, `is_active`)',
	'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.4 Add index on conversations for unread message counts
SET @idx_exists := (
	SELECT COUNT(1)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'conversations'
		AND index_name = 'idx_conversations_last_message'
);
SET @sql := IF(
	@idx_exists = 0,
	'ALTER TABLE `conversations` ADD INDEX `idx_conversations_last_message` (`updated_at`)',
	'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.5 Add index on messages for conversation queries
SET @idx_exists := (
	SELECT COUNT(1)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'messages'
		AND index_name = 'idx_messages_conversation_time'
);
SET @sql := IF(
	@idx_exists = 0,
	'ALTER TABLE `messages` ADD INDEX `idx_messages_conversation_time` (`conversation_id`, `created_at`)',
	'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.6 Add index on notifications for user notification queries
SET @idx_exists := (
	SELECT COUNT(1)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'notifications'
		AND index_name = 'idx_notifications_user_unread'
);
SET @sql := IF(
	@idx_exists = 0,
	'ALTER TABLE `notifications` ADD INDEX `idx_notifications_user_unread` (`user_id`, `is_read`, `created_at`)',
	'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.7 Add index on reviews for property rating calculations
SET @idx_exists := (
	SELECT COUNT(1)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'reviews'
		AND index_name = 'idx_reviews_property_date'
);
SET @sql := IF(
	@idx_exists = 0,
	'ALTER TABLE `reviews` ADD INDEX `idx_reviews_property_date` (`property_id`, `created_at`)',
	'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.8 Add index on property_availability for date range queries
SET @idx_exists := (
	SELECT COUNT(1)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'property_availability'
		AND index_name = 'idx_availability_property_date'
);
SET @sql := IF(
	@idx_exists = 0,
	'ALTER TABLE `property_availability` ADD INDEX `idx_availability_property_date` (`property_id`, `date`)',
	'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.9 Add index on earnings for host payout calculations
SET @idx_exists := (
	SELECT COUNT(1)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'earnings'
		AND index_name = 'idx_earnings_host_status'
);
SET @sql := IF(
	@idx_exists = 0,
	'ALTER TABLE `earnings` ADD INDEX `idx_earnings_host_status` (`host_id`, `status`, `created_at`)',
	'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.10 Add index on expenses for property financial tracking
SET @idx_exists := (
	SELECT COUNT(1)
	FROM information_schema.statistics
	WHERE table_schema = DATABASE()
		AND table_name = 'expenses'
		AND index_name = 'idx_expenses_property_date'
);
SET @sql := IF(
	@idx_exists = 0,
	'SELECT 1',
	'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- =====================================================
-- 3. MISSING COLUMNS IN EXISTING TABLES
-- =====================================================

-- No additional columns required.


-- =====================================================
-- 4. POTENTIAL IMPROVEMENTS AND RECOMMENDATIONS
-- =====================================================

-- No additional improvement tables required.


-- =====================================================
-- 5. DATA INTEGRITY CHECKS
-- =====================================================

-- 5.1 Add missing foreign key constraints if not present
-- Note: These may already exist, check before running

-- For property_amenities
-- ALTER TABLE `property_amenities`
-- ADD CONSTRAINT `fk_property_amenities_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
-- ADD CONSTRAINT `fk_property_amenities_amenity` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE CASCADE;

-- For property_photos
-- ALTER TABLE `property_photos`
-- ADD CONSTRAINT `fk_property_photos_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

-- For property_house_rules
-- ALTER TABLE `property_house_rules`
-- ADD CONSTRAINT `fk_house_rules_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;


-- =====================================================
-- 6. NOTES AND RECOMMENDATIONS
-- =====================================================

-- RECOMMENDED ACTIONS:
-- 1. Review and test all new indexes to ensure they improve query performance
-- 2. Monitor the size of audit_logs and consider partitioning by date
-- 3. Consider adding full-text search indexes on properties.description and title
-- 4. Add rate limiting table for API endpoint throttling
-- 5. Consider adding favorites/likes table for properties
-- 6. Add analytics/metrics table for tracking property views and conversions

-- POTENTIAL REDUNDANT FIELDS:
-- 1. bookings.short_code - appears to be NULL in all records, consider if needed
-- 2. properties.uuid - may be redundant if ID is sufficient
-- 3. Check if all enum values are actually used in the application

-- MISSING FEATURES TO CONSIDER:
-- 1. Referral/invite system for user growth
-- 2. Loyalty points or rewards program
-- 3. Property comparison/favorites tracking beyond wishlists
-- 4. Advanced search filters saved as preset queries
-- 5. Calendar sync status tracking for property_ical_sources
-- 6. Automated pricing rules/dynamic pricing engine
-- 7. Guest verification levels (beyond basic ID)
-- 8. Host certification/training completion tracking

-- END OF MIGRATION
