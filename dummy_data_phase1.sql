-- ============================================================
-- Oikivo Phase-1 Dummy Data
-- Host  : user 37  oikivo.support@gmail.com
-- Guest : user 43  tahamoataz5@gmail.com
-- New Property ID : 1001
-- Generated : 2026-05-10
-- Target    : MySQL 8+ / MariaDB 10.4+
--
-- SAFE to run on a DB that already has the old dummy_data.sql
-- imported. All IDs start from 1001+ / 2001+ etc. and are well
-- above the current AUTO_INCREMENT values in the schema dump.
--
-- HOW TO USE:
--   1. Open phpMyAdmin → SQL tab  (or mysql CLI)
--   2. Select database: sakan_db
--   3. Paste this file and click Go / run
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ============================================================
-- 1. PROPERTY  (host = user 37)
--    geo_point is auto-filled by the BEFORE INSERT trigger
-- ============================================================
INSERT INTO `properties` (
  `id`, `uuid`, `host_id`, `category_id`,
  `title`, `description`,
  `space_type`, `property_kind`,
  `price_per_night`, `weekend_price`,
  `weekly_discount_percent`, `monthly_discount_percent`,
  `new_listing_promotion_enabled`, `last_minute_discount_percent`,
  `booking_mode`, `approved_bookings_count`,
  `currency`, `cleaning_fee`, `security_deposit`,
  `service_fee_percent`, `host_commission_percent`,
  `min_nights`, `max_nights`, `turnover_days`,
  `max_guests`, `bedrooms`, `bathrooms`, `beds`,
  `address`, `city`, `timezone`, `country`, `country_code`,
  `latitude`, `longitude`,
  `check_in_after`, `check_out_before`,
  `check_in_instructions`,
  `allows_pets`, `allows_smoking`, `allows_parties`, `allows_children`,
  `instant_book`, `cancellation_policy`,
  `is_active`, `status`, `is_featured`,
  `avg_rating`, `review_count`, `view_count`, `impression_count`,
  `require_verified_guest`, `wizard_last_step`,
  `created_at`, `updated_at`
) VALUES (
  1001,
  'a1b2c3d4-1001-4001-8001-e0f1a2b3c4d5',
  37, 11,
  'Luxury Nile-View Apartment - Zamalek, Cairo',
  'A stunning fully-furnished 2-bedroom apartment on the 12th floor in the heart of Zamalek with a breathtaking panoramic Nile view. Equipped with high-speed Wi-Fi, split-system AC in every room, a fully-equipped kitchen, and 24/7 building security. Five minutes walk from embassies, cafes, and fine dining. Perfect for business travellers and couples seeking a premium Cairo experience.',
  'entire_place', 'apartment',
  1500.00, 1900.00,
  10.00, 18.00,
  1, 8.00,
  'instant_book', 4,
  'EGP', 350.00, 1000.00,
  5.00, 1.00,
  2, 30, 1,
  4, 2, 2.0, 3,
  '12 Shagaret El Dor St, Zamalek', 'Cairo', 'Africa/Cairo', 'Egypt', 'EG',
  30.0626000, 31.2194000,
  '14:00:00', '11:00:00',
  'Building intercom: press 12B then call. Parking: basement B1 spot 14. Wi-Fi: OikivoZamalek5G / Key: Cairo2026. Door code: 4829',
  0, 0, 0, 1,
  1, 'moderate',
  1, 'published', 1,
  4.90, 1, 80, 240,
  0, 6,
  '2026-01-15 10:00:00', '2026-05-01 09:00:00'
);

-- ============================================================
-- 2. PROPERTY PHOTOS
-- ============================================================
INSERT INTO `property_photos` (`id`, `property_id`, `url`, `caption`, `display_order`, `is_cover`, `created_at`) VALUES
(2001, 1001, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'Nile View Living Room',  0, 1, '2026-01-15 10:05:00'),
(2002, 1001, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'Master Bedroom',          1, 0, '2026-01-15 10:06:00'),
(2003, 1001, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'Modern Kitchen',          2, 0, '2026-01-15 10:07:00'),
(2004, 1001, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'Bathroom',              3, 0, '2026-01-15 10:08:00'),
(2005, 1001, 'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800', 'Nile Panorama Balcony',  4, 0, '2026-01-15 10:09:00');

-- ============================================================
-- 3. PROPERTY AMENITIES
--    PRIMARY KEY is (property_id, amenity_id) — no id column
-- ============================================================
INSERT INTO `property_amenities` (`property_id`, `amenity_id`) VALUES
(1001,  1),  -- WiFi
(1001,  2),  -- Kitchen
(1001,  3),  -- Free parking
(1001,  4),  -- Air conditioning
(1001,  6),  -- Washing machine
(1001,  8),  -- Dedicated workspace
(1001,  9),  -- TV
(1001, 10),  -- Hair dryer
(1001, 21),  -- Smoke alarm
(1001, 23),  -- Fire extinguisher
(1001, 24);  -- First aid kit

-- ============================================================
-- 4. PROPERTY HOUSE RULES
-- ============================================================
INSERT INTO `property_house_rules` (`id`, `property_id`, `rule`, `rule_ar`) VALUES
(3001, 1001, 'No smoking inside the apartment',        'ممنوع التدخين داخل الشقة'),
(3002, 1001, 'No pets allowed',                        'لا يسمح بالحيوانات الاليفة'),
(3003, 1001, 'No parties or events',                   'ممنوع اقامة الحفلات'),
(3004, 1001, 'Quiet hours between 10 PM and 8 AM',    'ساعات الهدوء بين 10 مساء و8 صباحا'),
(3005, 1001, 'Please remove shoes at the entrance',    'يرجى خلع الاحذية عند المدخل');

-- ============================================================
-- 5. PROPERTY AVAILABILITY
--    is_blocked: 0 = available (optional price override)
--                1 = blocked
--    UNIQUE KEY on (property_id, date) — no repeated dates
-- ============================================================
INSERT INTO `property_availability` (`id`, `property_id`, `date`, `is_blocked`, `price_override`, `source`, `ical_source_id`) VALUES
(4001, 1001, '2026-06-20', 0, 1200.00, 'host', NULL),
(4002, 1001, '2026-06-21', 0, 1200.00, 'host', NULL),
(4003, 1001, '2026-06-22', 0, 1200.00, 'host', NULL),
(4004, 1001, '2026-07-01', 0,  900.00, 'host', NULL),
(4005, 1001, '2026-07-05', 0, 2400.00, 'host', NULL),
(4006, 1001, '2026-07-06', 0, 2400.00, 'host', NULL),
(4007, 1001, '2026-07-15', 1,    NULL, 'host', NULL),
(4008, 1001, '2026-07-16', 1,    NULL, 'host', NULL),
(4009, 1001, '2026-07-17', 1,    NULL, 'host', NULL);

-- ============================================================
-- 6. PROPERTY iCAL SOURCES
-- ============================================================
INSERT INTO `property_ical_sources` (
  `id`, `property_id`, `label`, `url`,
  `sync_status`, `last_synced_at`, `created_at`, `updated_at`
) VALUES (
  6001, 1001, 'Airbnb Calendar',
  'https://www.airbnb.com/calendar/ical/dummy1001.ics',
  'success', '2026-05-10 06:00:00',
  '2026-01-20 09:00:00', '2026-05-10 06:00:00'
);

-- ============================================================
-- 7. PROPERTY PRICE HISTORY
-- ============================================================
INSERT INTO `property_price_history` (`id`, `property_id`, `base_price`, `recorded_at`) VALUES
(5001, 1001, 1800.00, '2026-01-15 10:00:00'),
(5002, 1001, 1600.00, '2026-02-10 08:00:00'),
(5003, 1001, 1500.00, '2026-03-01 09:00:00');

-- ============================================================
-- 8. COHOSTS  (guest 43 is also a co-host on property 1001)
-- ============================================================
INSERT INTO `cohosts` (`id`, `property_id`, `host_id`, `cohost_id`, `role`, `status`, `created_at`) VALUES
(7001, 1001, 37, 43, 'co_host', 'accepted', '2026-01-25 10:00:00');

-- ============================================================
-- 9. BOOKINGS  (6 bookings covering every status)
--
--  Service fee = discounted_base × 5%
--  Totals:
--    8001 COMPLETED  5n × 1500 = 7500 + 350 + 375        = 8225
--    8002 CONFIRMED  5n × 1500 = 7500 - 600(promo 8%)    = 6900 + 350 + 345 = 7595
--    8003 PENDING    4n × 1500 = 6000 + 350 + 300        = 6650
--    8004 CANCELLED  4n × 1500 = 6000 + 350 + 300        = 6650  (full refund)
--    8005 DECLINED   3n × 1500 = 4500 + 350 + 225        = 5075  (full refund)
--    8006 IN_PROGRESS 4n × 1500 = 6000 - 480(LM 8%)     = 5520 + 350 + 276 = 6146
-- ============================================================

-- ── 8001 : COMPLETED  Feb 10-15 ────────────────────────────
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `short_code`,
  `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `guests_count`, `nights`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `deposit_amount`, `deposit_status`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `house_rules_acknowledged`,
  `confirmed_at`, `completed_at`,
  `special_requests`,
  `created_at`, `updated_at`
) VALUES (
  8001, '11111111-aaaa-4001-8001-000000000001', 'OKV-8001',
  1001, 43, 37,
  '2026-02-10', '2026-02-15', 2, 5,
  1500.00, 7500.00, 350.00, 375.00, 0.00, 8225.00,
  0.00, 'none',
  'EGP', 'completed', 'paid', 'opay-card',
  'moderate',
  NULL, 0.00, 0.00,
  1,
  '2026-02-05 10:30:00', '2026-02-15 11:00:00',
  'Please leave extra towels.',
  '2026-02-05 09:00:00', '2026-02-15 11:00:00'
);

-- ── 8002 : CONFIRMED  Jun 10-15 (future) ───────────────────
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `short_code`,
  `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `guests_count`, `nights`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `deposit_amount`, `deposit_status`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `house_rules_acknowledged`,
  `confirmed_at`,
  `special_requests`,
  `created_at`, `updated_at`
) VALUES (
  8002, '22222222-bbbb-4002-8002-000000000002', 'OKV-8002',
  1001, 43, 37,
  '2026-06-10', '2026-06-15', 3, 5,
  1500.00, 7500.00, 350.00, 345.00, 0.00, 7595.00,
  0.00, 'none',
  'EGP', 'confirmed', 'paid', 'opay-card',
  'moderate',
  'new_listing_promotion', 600.00, 8.00,
  1,
  '2026-05-01 11:30:00',
  'Early check-in around 12 PM if possible.',
  '2026-05-01 11:00:00', '2026-05-01 11:30:00'
);

-- ── 8003 : PENDING  Jul 20-24 (future, awaiting payment) ───
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `short_code`,
  `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `guests_count`, `nights`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `deposit_amount`, `deposit_status`,
  `currency`, `status`, `payment_status`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `house_rules_acknowledged`,
  `created_at`, `updated_at`
) VALUES (
  8003, '33333333-cccc-4003-8003-000000000003', 'OKV-8003',
  1001, 43, 37,
  '2026-07-20', '2026-07-24', 2, 4,
  1500.00, 6000.00, 350.00, 300.00, 0.00, 6650.00,
  0.00, 'none',
  'EGP', 'pending', 'pending',
  'moderate',
  NULL, 0.00, 0.00,
  0,
  '2026-05-09 14:00:00', '2026-05-09 14:00:00'
);

-- ── 8004 : CANCELLED by guest  Mar 1-5 (full refund) ───────
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `short_code`,
  `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `guests_count`, `nights`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `deposit_amount`, `deposit_status`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `house_rules_acknowledged`,
  `confirmed_at`,
  `cancellation_reason`, `cancelled_by`, `cancelled_at`,
  `refund_amount`,
  `created_at`, `updated_at`
) VALUES (
  8004, '44444444-dddd-4004-8004-000000000004', 'OKV-8004',
  1001, 43, 37,
  '2026-03-01', '2026-03-05', 2, 4,
  1500.00, 6000.00, 350.00, 300.00, 0.00, 6650.00,
  0.00, 'none',
  'EGP', 'cancelled', 'refunded', 'opay-card',
  'moderate',
  NULL, 0.00, 0.00,
  1,
  '2026-02-20 11:00:00',
  'Change of plans due to personal emergency', 'guest', '2026-02-25 17:00:00',
  6650.00,
  '2026-02-20 10:00:00', '2026-02-25 17:00:00'
);

-- ── 8005 : DECLINED by host  Apr 1-4 (guest count exceeded) ─
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `short_code`,
  `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `guests_count`, `nights`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `deposit_amount`, `deposit_status`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `house_rules_acknowledged`,
  `cancellation_reason`, `cancelled_by`, `cancelled_at`,
  `refund_amount`,
  `created_at`, `updated_at`
) VALUES (
  8005, '55555555-eeee-4005-8005-000000000005', 'OKV-8005',
  1001, 43, 37,
  '2026-04-01', '2026-04-04', 6, 3,
  1500.00, 4500.00, 350.00, 225.00, 0.00, 5075.00,
  0.00, 'none',
  'EGP', 'declined', 'refunded', 'opay-card',
  'moderate',
  NULL, 0.00, 0.00,
  0,
  'Guest count (6) exceeds property maximum of 4', 'host', '2026-03-27 10:00:00',
  5075.00,
  '2026-03-26 09:00:00', '2026-03-27 10:00:00'
);

-- ── 8006 : IN_PROGRESS  May 8-12 (currently staying) ───────
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `short_code`,
  `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `guests_count`, `nights`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `deposit_amount`, `deposit_status`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `house_rules_acknowledged`,
  `confirmed_at`,
  `special_requests`,
  `created_at`, `updated_at`
) VALUES (
  8006, '66666666-ffff-4006-8006-000000000006', 'OKV-8006',
  1001, 43, 37,
  '2026-05-08', '2026-05-12', 2, 4,
  1500.00, 6000.00, 350.00, 276.00, 0.00, 6146.00,
  0.00, 'none',
  'EGP', 'in_progress', 'paid', 'opay-card',
  'moderate',
  'last_minute', 480.00, 8.00,
  1,
  '2026-05-06 10:30:00',
  'Would appreciate parking assistance on arrival.',
  '2026-05-05 19:00:00', '2026-05-08 14:00:00'
);

-- ============================================================
-- 10. BOOKING STATUS HISTORY
-- ============================================================
INSERT INTO `booking_status_history` (
  `id`, `booking_id`, `from_status`, `to_status`,
  `changed_by_id`, `changed_by_role`, `reason`, `created_at`
) VALUES
-- Booking 8001 (completed journey)
(9001, 8001, NULL,          'pending',     43,   'guest',  'Booking created',                  '2026-02-05 09:00:00'),
(9002, 8001, 'pending',     'confirmed',   37,   'host',   'Host accepted',                    '2026-02-05 10:30:00'),
(9003, 8001, 'confirmed',   'in_progress', NULL, 'system', 'Check-in date reached',            '2026-02-10 14:00:00'),
(9004, 8001, 'in_progress', 'completed',   NULL, 'system', 'Check-out date reached',           '2026-02-15 11:00:00'),
-- Booking 8002 (confirmed)
(9005, 8002, NULL,          'pending',     43,   'guest',  'Booking created',                  '2026-05-01 11:00:00'),
(9006, 8002, 'pending',     'confirmed',   37,   'host',   'Host accepted',                    '2026-05-01 11:30:00'),
-- Booking 8003 (pending)
(9007, 8003, NULL,          'pending',     43,   'guest',  'Booking created',                  '2026-05-09 14:00:00'),
-- Booking 8004 (cancelled)
(9008, 8004, NULL,          'pending',     43,   'guest',  'Booking created',                  '2026-02-20 10:00:00'),
(9009, 8004, 'pending',     'confirmed',   37,   'host',   'Host accepted',                    '2026-02-20 11:00:00'),
(9010, 8004, 'confirmed',   'cancelled',   43,   'guest',  'Personal emergency',               '2026-02-25 17:00:00'),
-- Booking 8005 (declined)
(9011, 8005, NULL,          'pending',     43,   'guest',  'Booking created',                  '2026-03-26 09:00:00'),
(9012, 8005, 'pending',     'declined',    37,   'host',   'Guest count exceeds maximum of 4', '2026-03-27 10:00:00'),
-- Booking 8006 (in_progress)
(9013, 8006, NULL,          'pending',     43,   'guest',  'Booking created',                  '2026-05-05 19:00:00'),
(9014, 8006, 'pending',     'confirmed',   37,   'host',   'Host accepted',                    '2026-05-06 10:30:00'),
(9015, 8006, 'confirmed',   'in_progress', NULL, 'system', 'Check-in date reached',            '2026-05-08 14:00:00');

-- ============================================================
-- 11. PAYMENT TRANSACTIONS
-- ============================================================
INSERT INTO `payment_transactions` (
  `id`, `booking_id`, `type`, `amount`, `currency`,
  `gateway`, `gateway_reference`, `status`, `metadata`,
  `created_at`, `updated_at`
) VALUES
(10001, 8001, 'charge',  8225.00, 'EGP', 'opay', 'OPY-2026-8001-CHG', 'success', '{"code":"00","message":"Approved"}', '2026-02-05 09:05:00', '2026-02-05 09:05:00'),
(10002, 8002, 'charge',  7595.00, 'EGP', 'opay', 'OPY-2026-8002-CHG', 'success', '{"code":"00","message":"Approved"}', '2026-05-01 11:05:00', '2026-05-01 11:05:00'),
(10003, 8003, 'charge',  6650.00, 'EGP', 'opay', 'OPY-2026-8003-CHG', 'pending', '{"code":"01","message":"Pending"}',  '2026-05-09 14:05:00', '2026-05-09 14:05:00'),
(10004, 8004, 'charge',  6650.00, 'EGP', 'opay', 'OPY-2026-8004-CHG', 'success', '{"code":"00","message":"Approved"}', '2026-02-20 10:05:00', '2026-02-20 10:05:00'),
(10005, 8004, 'refund',  6650.00, 'EGP', 'opay', 'OPY-2026-8004-REF', 'success', '{"code":"00","message":"Refunded"}', '2026-02-25 18:00:00', '2026-02-25 18:00:00'),
(10006, 8005, 'charge',  5075.00, 'EGP', 'opay', 'OPY-2026-8005-CHG', 'success', '{"code":"00","message":"Approved"}', '2026-03-26 09:05:00', '2026-03-26 09:05:00'),
(10007, 8005, 'refund',  5075.00, 'EGP', 'opay', 'OPY-2026-8005-REF', 'success', '{"code":"00","message":"Refunded"}', '2026-03-27 11:00:00', '2026-03-27 11:00:00'),
(10008, 8006, 'charge',  6146.00, 'EGP', 'opay', 'OPY-2026-8006-CHG', 'success', '{"code":"00","message":"Approved"}', '2026-05-05 19:05:00', '2026-05-05 19:05:00');

-- ============================================================
-- 12. EARNINGS  (host 37)
--     amount       = booking total_amount
--     platform_fee = amount × 5%  (service fee kept by platform)
--     host receives = amount - platform_fee  (see payouts below)
-- ============================================================
INSERT INTO `earnings` (
  `id`, `host_id`, `booking_id`, `amount`, `platform_fee`,
  `currency`, `status`, `available_at`, `created_at`
) VALUES
(11001, 37, 8001, 8225.00, 411.25, 'EGP', 'paid',      '2026-02-16 00:00:00', '2026-02-15 11:00:00'),
(11002, 37, 8002, 7595.00, 379.75, 'EGP', 'available', '2026-06-16 00:00:00', '2026-05-01 11:30:00'),
(11003, 37, 8006, 6146.00, 307.30, 'EGP', 'pending',   '2026-05-13 00:00:00', '2026-05-08 14:00:00');

-- ============================================================
-- 13. PAYOUTS  (host 37)
--     amount = earning.amount - earning.platform_fee
--       12001: 8225.00 - 411.25 = 7813.75
--       12002: 7595.00 - 379.75 = 7215.25
-- ============================================================
INSERT INTO `payouts` (
  `id`, `host_id`, `amount`, `currency`, `method`,
  `is_auto`, `status`, `note`, `transfer_reference`,
  `processed_at`, `created_at`, `updated_at`
) VALUES
(12001, 37, 7813.75, 'EGP', 'bank_transfer', 0, 'completed',
 'Payout for completed booking 8001', 'BANK-2026-8001-PAY',
 '2026-03-01 14:00:00', '2026-02-28 10:00:00', '2026-03-01 14:00:00'),
(12002, 37, 7215.25, 'EGP', 'bank_transfer', 0, 'pending',
 'Pending payout for confirmed booking 8002', NULL,
 NULL, '2026-05-31 10:00:00', '2026-05-31 10:00:00');

-- ============================================================
-- 14. PAYOUT ITEMS
-- ============================================================
INSERT INTO `payout_items` (
  `id`, `payout_id`, `earning_id`, `booking_id`, `amount`, `created_at`
) VALUES
(13001, 12001, 11001, 8001, 7813.75, '2026-02-28 10:00:00'),
(13002, 12002, 11002, 8002, 7215.25, '2026-05-31 10:00:00');

-- ============================================================
-- 15. REVIEWS  (only for completed booking 8001)
--     UNIQUE KEY on (booking_id, reviewer_role) — one per role
-- ============================================================
INSERT INTO `reviews` (
  `id`, `booking_id`, `reviewer_id`, `reviewer_role`, `reviewed_user_id`,
  `property_id`,
  `overall_rating`, `cleanliness_rating`, `accuracy_rating`,
  `communication_rating`, `location_rating`, `value_rating`, `checkin_rating`,
  `comment`, `host_reply`, `host_replied_at`,
  `is_flagged`, `is_deleted`,
  `created_at`
) VALUES
-- Guest (43) reviews the property
(14001,
 8001, 43, 'guest', NULL,
 1001,
 5, 5, 5, 5, 5, 5, 5,
 'Absolutely breathtaking Nile view! The apartment was spotless, beautifully furnished, and the host was extremely responsive. Building security was excellent and the location in Zamalek is unbeatable. Will definitely book again!',
 'Thank you Taha! We are so happy you enjoyed your stay. You are always welcome back!',
 '2026-02-16 13:00:00',
 0, 0,
 '2026-02-16 10:00:00'),
-- Host (37) reviews the guest
(14002,
 8001, 37, 'host', 43,
 1001,
 5, NULL, NULL, 5, NULL, NULL, NULL,
 'Taha was an exemplary guest. The apartment was left in perfect condition, full communication throughout the stay, and always respectful of house rules. Highly recommended!',
 NULL, NULL,
 0, 0,
 '2026-02-16 12:00:00');

-- ============================================================
-- 16. CONVERSATIONS
-- ============================================================
INSERT INTO `conversations` (
  `id`, `property_id`, `booking_id`, `host_id`, `guest_id`,
  `created_at`, `updated_at`
) VALUES
(15001, 1001, 8001, 37, 43, '2026-02-05 09:10:00', '2026-02-15 12:00:00'),
(15002, 1001, 8002, 37, 43, '2026-05-01 11:00:00', '2026-05-01 12:00:00');

-- ============================================================
-- 17. MESSAGES
-- ============================================================
INSERT INTO `messages` (
  `id`, `conversation_id`, `sender_id`, `body`,
  `message_type`, `is_read`, `read_at`, `created_at`
) VALUES
-- Conversation 15001 (booking 8001 – completed stay)
(16001, 15001, 43,
 'Hi! Just booked. Really excited about the Nile view. Looking forward to my stay!',
 'text', 1, '2026-02-05 10:00:00', '2026-02-05 09:10:00'),
(16002, 15001, 37,
 'Welcome Taha! We are so excited to host you. Feel free to ask anything before check-in.',
 'text', 1, '2026-02-05 10:30:00', '2026-02-05 10:30:00'),
(16003, 15001, 43,
 'Will there be parking available for my car?',
 'text', 1, '2026-02-09 14:00:00', '2026-02-09 14:00:00'),
(16004, 15001, 37,
 'Yes! Basement B1 spot 14 is reserved for you. I will share the access code on check-in day.',
 'text', 1, '2026-02-09 15:00:00', '2026-02-09 15:00:00'),
(16005, 15001, 43,
 'Perfect, thank you so much!',
 'text', 1, '2026-02-09 15:30:00', '2026-02-09 15:30:00'),
(16006, 15001, 43,
 'Just checked out. What an incredible stay! The Nile sunset from the balcony was unforgettable.',
 'text', 1, '2026-02-15 12:00:00', '2026-02-15 11:30:00'),
(16007, 15001, 37,
 'Thank you Taha! Such a pleasure hosting you. Come back anytime!',
 'text', 1, '2026-02-15 12:30:00', '2026-02-15 12:00:00'),
-- Conversation 15002 (booking 8002 – upcoming confirmed stay)
(16008, 15002, 43,
 'Hi! I booked for Jun 10-15. Is a 12 PM check-in possible? Our flight arrives early.',
 'text', 1, '2026-05-01 11:10:00', '2026-05-01 11:10:00'),
(16009, 15002, 37,
 'Hi Taha, welcome back! I will do my best to have the apartment ready by 12 PM and confirm closer to the date.',
 'text', 1, '2026-05-01 11:30:00', '2026-05-01 11:30:00');

-- ============================================================
-- 18. NOTIFICATIONS
-- ============================================================
INSERT INTO `notifications` (
  `id`, `user_id`, `type`,
  `title`, `title_ar`,
  `body`, `body_ar`,
  `data_json`, `is_read`, `created_at`
) VALUES
-- ── Host (37) ───────────────────────────────────────────────
(17001, 37, 'booking_request',
 'New Booking Request', 'طلب حجز جديد',
 'Taha Moataz requested to book your Zamalek apartment for Feb 10-15.',
 'طلب تاها معتز حجز شقتك في الزمالك من 10 الى 15 فبراير.',
 '{"bookingId":8001,"propertyId":1001}', 1, '2026-02-05 09:00:00'),

(17002, 37, 'booking_completed',
 'Stay Completed', 'اكتملت الاقامة',
 'Taha Moataz has checked out from your Zamalek apartment.',
 'غادر تاها معتز شقتك في الزمالك.',
 '{"bookingId":8001,"propertyId":1001}', 1, '2026-02-15 11:00:00'),

(17003, 37, 'new_review',
 'New Review Received', 'تقييم جديد',
 'Taha Moataz left you a 5-star review!',
 'ترك تاها معتز تقييما بخمس نجوم!',
 '{"reviewId":14001,"propertyId":1001}', 1, '2026-02-16 10:00:00'),

(17004, 37, 'payout_processed',
 'Payout Completed', 'تمت معالجة الدفع',
 'Your payout of EGP 7,813.75 has been transferred to your bank account.',
 'تم تحويل دفعتك بقيمة 7813.75 جنيه الى حسابك البنكي.',
 '{"payoutId":12001,"amount":7813.75}', 1, '2026-03-01 14:00:00'),

(17005, 37, 'booking_request',
 'New Booking Request', 'طلب حجز جديد',
 'Taha Moataz requested to book your apartment for Jun 10-15.',
 'طلب تاها معتز الحجز من 10 الى 15 يونيو.',
 '{"bookingId":8002,"propertyId":1001}', 1, '2026-05-01 11:00:00'),

(17006, 37, 'booking_request',
 'New Booking Request', 'طلب حجز جديد',
 'Taha Moataz requested to book your apartment for Jul 20-24.',
 'طلب تاها معتز الحجز من 20 الى 24 يوليو.',
 '{"bookingId":8003,"propertyId":1001}', 0, '2026-05-09 14:00:00'),

(17007, 37, 'dispute_opened',
 'Dispute Filed', 'نزاع مفتوح',
 'Taha Moataz opened a dispute for the stay May 8-12.',
 'فتح تاها معتز نزاعا على اقامته من 8 الى 12 مايو.',
 '{"disputeId":18001,"bookingId":8006}', 0, '2026-05-09 10:30:00'),

-- ── Guest (43) ──────────────────────────────────────────────
(17008, 43, 'booking_confirmed',
 'Booking Confirmed', 'تم تاكيد الحجز',
 'Your booking at Luxury Nile-View Apartment (Feb 10-15) is confirmed!',
 'تم تاكيد حجزك في شقة نيل الزمالك من 10 الى 15 فبراير!',
 '{"bookingId":8001,"propertyId":1001}', 1, '2026-02-05 10:30:00'),

(17009, 43, 'booking_reminder',
 'Check-in Tomorrow', 'تسجيل الدخول غدا',
 'Reminder: Your check-in at Zamalek apartment is tomorrow at 2 PM.',
 'تذكير: تسجيل دخولك في شقة الزمالك غدا الساعة 2 مساء.',
 '{"bookingId":8001,"propertyId":1001}', 1, '2026-02-09 09:00:00'),

(17010, 43, 'new_review',
 'Review from Host', 'تقييم من المضيف',
 'Oikivo Support left you a 5-star guest review.',
 'ترك لك دعم اويكيفو تقييما بخمس نجوم.',
 '{"reviewId":14002}', 1, '2026-02-16 12:00:00'),

(17011, 43, 'booking_confirmed',
 'Booking Confirmed', 'تم تاكيد الحجز',
 'Your booking for Jun 10-15 at Zamalek apartment is confirmed!',
 'تم تاكيد حجزك من 10 الى 15 يونيو في شقة الزمالك!',
 '{"bookingId":8002,"propertyId":1001}', 1, '2026-05-01 11:30:00'),

(17012, 43, 'booking_declined',
 'Booking Declined', 'تم رفض الحجز',
 'Your booking request for Apr 1-4 was declined: guest count exceeds limit.',
 'تم رفض طلب حجزك من 1 الى 4 ابريل: عدد الضيوف يتجاوز الحد.',
 '{"bookingId":8005,"propertyId":1001}', 1, '2026-03-27 10:00:00');

-- ============================================================
-- 19. DISPUTES
-- ============================================================
INSERT INTO `disputes` (
  `id`, `uuid`, `booking_id`, `raised_by_id`,
  `category`, `title`, `description`,
  `status`, `resolution`, `admin_note`,
  `priority`, `appeal_requested`,
  `created_at`, `updated_at`
) VALUES
-- Open dispute on the in_progress stay
(18001,
 'd1a2b3c4-8006-4001-9001-e1f2a3b4c5d6',
 8006, 43,
 'property_not_as_described',
 'Second bedroom AC not working',
 'The air conditioning unit in the second bedroom was completely non-functional despite being listed as available. The balcony view was also partially obscured by nearby scaffolding not shown in photos.',
 'open', NULL, NULL,
 'medium', 0,
 '2026-05-09 10:30:00', '2026-05-09 10:30:00'),
-- Resolved dispute on the cancelled booking
(18002,
 'f2b3c4d5-8004-4002-9002-f2e3d4c5b6a7',
 8004, 43,
 'refund_request',
 'Full refund requested - personal emergency',
 'Guest cancelled outside the free-cancellation window due to a documented medical emergency. Requesting full refund waiver of the cancellation penalty.',
 'resolved', 'resolved_for_guest',
 'Full refund issued as a goodwill gesture. Medical documentation reviewed and accepted.',
 'low', 0,
 '2026-02-25 17:30:00', '2026-02-26 09:00:00');

-- ============================================================
-- 20. WISHLISTS  (guest 43)
-- ============================================================
INSERT INTO `wishlists` (
  `id`, `uuid`, `user_id`, `name`, `visibility`, `share_token`, `cover_photo`, `created_at`
) VALUES
(19001, 'wish-1001-cairo-top-picks',  43, 'Cairo Top Picks',   'private', 'shr-tok-1001-cairo', NULL, '2026-01-10 09:00:00'),
(19002, 'wish-1002-zamalek-favs',     43, 'Zamalek Favourites','public',  'shr-tok-1002-zmlk',  NULL, '2026-02-16 14:00:00');

-- ============================================================
-- 21. WISHLIST ITEMS
-- ============================================================
INSERT INTO `wishlist_items` (`id`, `wishlist_id`, `property_id`, `added_at`) VALUES
(20001, 19001, 1001, '2026-01-15 11:00:00'),
(20002, 19002, 1001, '2026-02-16 10:00:00');

-- ============================================================
-- 22. PRICE ALERTS  (guest 43 watching property 1001)
-- ============================================================
INSERT INTO `price_alerts` (
  `id`, `user_id`, `property_id`, `target_price`,
  `last_known_price`, `active`, `notified_at`, `created_at`
) VALUES
(21001, 43, 1001, 1000.00, 1500.00, 1, NULL, '2026-01-20 10:00:00');

-- ============================================================
-- 23. SAVED SEARCHES  (guest 43)
-- ============================================================
INSERT INTO `saved_searches` (
  `id`, `user_id`, `name`, `filters`, `alert_enabled`, `last_alerted_at`, `created_at`
) VALUES
(22001, 43, 'Zamalek Premium Stays',
 '{"city":"Cairo","district":"Zamalek","max_price":2000,"min_bedrooms":2,"space_type":"entire_place"}',
 1, NULL, '2026-01-15 10:30:00'),
(22002, 43, 'Cairo City Apartments',
 '{"city":"Cairo","property_kind":"apartment","max_price":2500,"min_bedrooms":2,"guests":2}',
 0, NULL, '2026-02-05 08:30:00');

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
-- END OF DUMMY DATA
-- ============================================================
