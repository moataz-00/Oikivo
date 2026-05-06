-- ============================================================
-- Oikivo Dummy Data for Testing
-- Host: user 37 (oikivo.support@gmail.com)
-- Guest: user 40 (tahamoataz5@gmail.com)
-- New Property ID: 300
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- PROPERTY
-- geo_point is set automatically by the BEFORE INSERT trigger
-- ============================================================
INSERT INTO `properties` (
  `id`, `uuid`, `host_id`, `category_id`,
  `title`, `description`,
  `space_type`, `property_kind`,
  `price_per_night`, `weekend_price`,
  `weekly_discount_percent`, `monthly_discount_percent`,
  `new_listing_promotion_enabled`, `last_minute_discount_percent`,
  `booking_mode`, `currency`, `cleaning_fee`, `security_deposit`,
  `service_fee_percent`, `host_commission_percent`,
  `min_nights`, `max_nights`, `turnover_days`,
  `max_guests`, `bedrooms`, `bathrooms`, `beds`,
  `address`, `city`, `state`, `country`, `country_code`,
  `latitude`, `longitude`,
  `check_in_after`, `check_out_before`,
  `allows_pets`, `allows_smoking`, `allows_parties`, `allows_children`,
  `instant_book`, `cancellation_policy`,
  `is_active`, `status`, `is_featured`,
  `avg_rating`, `review_count`, `view_count`, `impression_count`,
  `created_at`, `updated_at`
) VALUES (
  300, 'aabbccdd-1234-5678-abcd-ef0123456789', 37, 1,
  'Modern Apartment in Maadi - Full Amenities',
  'A spacious modern apartment in the heart of Maadi, Cairo. Fully furnished with high-speed internet, air conditioning, and a stunning city view. Perfect for short and long stays.',
  'entire_place', 'apartment',
  1200.00, 1500.00,
  10.00, 15.00,
  1, 5.00,
  'instant_book', 'EGP', 300.00, 500.00,
  5.00, 0.00,
  2, 30, 1,
  4, 2, 1.0, 3,
  '15 Road 9, Maadi', 'Cairo', NULL, 'Egypt', 'EG',
  29.9602, 31.2569,
  '14:00:00', '11:00:00',
  0, 0, 0, 1,
  1, 'moderate',
  1, 'published', 0,
  4.90, 1, 10, 5,
  '2026-01-10 10:00:00', '2026-04-01 12:00:00'
);

-- ============================================================
-- PROPERTY PHOTOS
-- ============================================================
INSERT INTO `property_photos` (`id`, `property_id`, `url`, `caption`, `display_order`, `is_cover`, `created_at`) VALUES
(600, 300, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'Living Room',    0, 1, '2026-01-10 10:05:00'),
(601, 300, 'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800', 'Master Bedroom', 1, 0, '2026-01-10 10:06:00'),
(602, 300, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 'Kitchen',        2, 0, '2026-01-10 10:07:00'),
(603, 300, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'Bathroom',    3, 0, '2026-01-10 10:08:00'),
(604, 300, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'Balcony View', 4, 0, '2026-01-10 10:09:00');

-- ============================================================
-- PROPERTY AMENITIES
-- ============================================================
INSERT INTO `property_amenities` (`property_id`, `amenity_id`) VALUES
(300, 1),
(300, 2),
(300, 3),
(300, 5),
(300, 7),
(300, 10),
(300, 11),
(300, 12),
(300, 17),
(300, 18);

-- ============================================================
-- PROPERTY HOUSE RULES
-- ============================================================
INSERT INTO `property_house_rules` (`id`, `property_id`, `rule`, `rule_ar`) VALUES
(700, 300, 'No smoking inside the apartment', 'ممنوع التدخين داخل الشقة'),
(701, 300, 'No pets allowed',                  'لا يسمح بالحيوانات الاليفة'),
(702, 300, 'No parties or events',             'ممنوع اقامة الحفلات او الفعاليات'),
(703, 300, 'Quiet hours after 10 PM',          'ساعات الهدوء بعد الساعة 10 مساء'),
(704, 300, 'Please take off shoes at the door', 'يرجى خلع الاحذية عند الباب');

-- ============================================================
-- PROPERTY AVAILABILITY
-- is_blocked: 0 = available (with optional price_override), 1 = blocked
-- source enum: 'host' | 'ical' | 'booking'
-- ============================================================
INSERT INTO `property_availability` (`id`, `property_id`, `date`, `is_blocked`, `price_override`, `source`, `ical_source_id`) VALUES
(800, 300, '2026-06-01', 0,  800.00, 'host', NULL),
(801, 300, '2026-06-02', 0,  800.00, 'host', NULL),
(802, 300, '2026-06-07', 0,  750.00, 'host', NULL),
(803, 300, '2026-06-14', 0,  750.00, 'host', NULL),
(804, 300, '2026-06-20', 0, 2500.00, 'host', NULL),
(805, 300, '2026-06-21', 0, 2500.00, 'host', NULL),
(806, 300, '2026-07-01', 1, NULL, 'host', NULL),
(807, 300, '2026-07-02', 1, NULL, 'host', NULL),
(808, 300, '2026-07-03', 1, NULL, 'host', NULL);

-- ============================================================
-- PROPERTY ICAL SOURCES
-- ============================================================
INSERT INTO `property_ical_sources` (`id`, `property_id`, `label`, `url`, `sync_status`, `last_synced_at`, `created_at`) VALUES
(300, 300, 'Airbnb Calendar', 'https://www.airbnb.com/calendar/ical/dummy300.ics', 'success', '2026-05-01 06:00:00', '2026-01-15 09:00:00');

-- ============================================================
-- PROPERTY PRICE HISTORY
-- ============================================================
INSERT INTO `property_price_history` (`id`, `property_id`, `base_price`, `recorded_at`) VALUES
(300, 300, 1200.00, '2026-01-10 10:00:00'),
(301, 300, 1000.00, '2026-02-01 12:00:00'),
(302, 300, 1200.00, '2026-03-01 09:00:00');

-- ============================================================
-- COHOSTS
-- role enum: 'co_host' | 'cleaner'
-- status enum: 'pending' | 'accepted' | 'declined'
-- ============================================================
INSERT INTO `cohosts` (`id`, `property_id`, `host_id`, `cohost_id`, `role`, `status`, `created_at`) VALUES
(300, 300, 37, 40, 'co_host', 'accepted', '2026-01-20 10:00:00');

-- ============================================================
-- BOOKINGS (all status types)
-- ============================================================

-- Booking 620: COMPLETED
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `nights`, `guests_count`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `special_requests`, `created_at`, `updated_at`
) VALUES (
  620, 'book-0001-completed-prop300-u40', 300, 40, 37,
  '2026-02-10', '2026-02-15', 5, 2,
  1200.00, 6000.00, 300.00, 315.00, 0.00, 6615.00,
  'EGP', 'completed', 'paid', 'opay',
  'moderate',
  NULL, 0.00, 0.00,
  'Please leave extra towels.',
  '2026-02-05 09:00:00', '2026-02-15 12:00:00'
);

-- Booking 621: CONFIRMED
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `nights`, `guests_count`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `special_requests`, `created_at`, `updated_at`
) VALUES (
  621, 'book-0002-confirmed-prop300-u40', 300, 40, 37,
  '2026-06-05', '2026-06-10', 5, 3,
  1200.00, 6000.00, 300.00, 315.00, 0.00, 6315.00,
  'EGP', 'confirmed', 'paid', 'opay',
  'moderate',
  'weekly', 300.00, 5.00,
  'Early check-in if possible.',
  '2026-05-20 11:00:00', '2026-05-20 11:30:00'
);

-- Booking 622: PENDING
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `nights`, `guests_count`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `currency`, `status`, `payment_status`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `created_at`, `updated_at`
) VALUES (
  622, 'book-0003-pending-prop300-u40', 300, 40, 37,
  '2026-07-10', '2026-07-14', 4, 2,
  1200.00, 4800.00, 300.00, 255.00, 0.00, 5115.00,
  'EGP', 'pending', 'pending',
  'moderate',
  'new_listing_promotion', 240.00, 5.00,
  '2026-06-01 14:00:00', '2026-06-01 14:00:00'
);

-- Booking 623: CANCELLED by guest
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `nights`, `guests_count`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `cancellation_reason`, `cancelled_by`, `cancelled_at`,
  `created_at`, `updated_at`
) VALUES (
  623, 'book-0004-cancelled-prop300-u40', 300, 40, 37,
  '2026-03-01', '2026-03-05', 4, 2,
  1200.00, 4800.00, 300.00, 255.00, 0.00, 5355.00,
  'EGP', 'cancelled', 'refunded', 'opay',
  'moderate',
  NULL, 0.00, 0.00,
  'Change of plans, cannot travel', 'guest', '2026-02-25 16:00:00',
  '2026-02-20 10:00:00', '2026-02-25 16:00:00'
);

-- Booking 624: DECLINED by host
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `nights`, `guests_count`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `cancellation_reason`, `cancelled_by`, `cancelled_at`,
  `created_at`, `updated_at`
) VALUES (
  624, 'book-0005-declined-prop300-u40', 300, 40, 37,
  '2026-04-01', '2026-04-04', 3, 5,
  1200.00, 3600.00, 300.00, 195.00, 0.00, 4095.00,
  'EGP', 'declined', 'refunded', 'opay',
  'moderate',
  NULL, 0.00, 0.00,
  'Guest count exceeds maximum capacity', 'host', '2026-03-26 10:00:00',
  '2026-03-25 09:00:00', '2026-03-26 10:00:00'
);

-- Booking 625: IN_PROGRESS
INSERT INTO `bookings` (
  `id`, `booking_uuid`, `property_id`, `guest_id`, `host_id`,
  `check_in`, `check_out`, `nights`, `guests_count`,
  `price_per_night`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`,
  `currency`, `status`, `payment_status`, `payment_method`,
  `cancellation_policy`,
  `discount_type`, `discount_amount`, `discount_percent`,
  `special_requests`, `created_at`, `updated_at`
) VALUES (
  625, 'book-0006-inprogress-prop300-u40', 300, 40, 37,
  '2026-05-25', '2026-05-30', 5, 2,
  1200.00, 6000.00, 300.00, 315.00, 0.00, 6315.00,
  'EGP', 'in_progress', 'paid', 'opay',
  'moderate',
  'last_minute', 600.00, 10.00,
  'Need parking space please.',
  '2026-05-23 08:00:00', '2026-05-25 14:00:00'
);

-- ============================================================
-- BOOKING STATUS HISTORY
-- changed_by_role enum: 'guest' | 'host' | 'admin' | 'system'
-- ============================================================
INSERT INTO `booking_status_history` (`id`, `booking_id`, `from_status`, `to_status`, `changed_by_id`, `changed_by_role`, `reason`, `created_at`) VALUES
(700, 620, NULL,          'pending',     40,   'guest',  'Booking created',        '2026-02-05 09:00:00'),
(701, 620, 'pending',     'confirmed',   37,   'host',   'Host accepted',           '2026-02-05 10:00:00'),
(702, 620, 'confirmed',   'in_progress', NULL, 'system', 'Check-in date reached',  '2026-02-10 14:00:00'),
(703, 620, 'in_progress', 'completed',   NULL, 'system', 'Checkout date reached',  '2026-02-15 11:00:00'),
(704, 621, NULL,          'pending',     40,   'guest',  'Booking created',        '2026-05-20 11:00:00'),
(705, 621, 'pending',     'confirmed',   37,   'host',   'Host accepted',           '2026-05-20 11:30:00'),
(706, 622, NULL,          'pending',     40,   'guest',  'Booking created',        '2026-06-01 14:00:00'),
(707, 623, NULL,          'pending',     40,   'guest',  'Booking created',        '2026-02-20 10:00:00'),
(708, 623, 'pending',     'confirmed',   37,   'host',   'Host accepted',           '2026-02-20 11:00:00'),
(709, 623, 'confirmed',   'cancelled',   40,   'guest',  'Change of plans',        '2026-02-25 16:00:00'),
(710, 624, NULL,          'pending',     40,   'guest',  'Booking created',        '2026-03-25 09:00:00'),
(711, 624, 'pending',     'declined',    37,   'host',   'Guest count too high',   '2026-03-26 10:00:00'),
(712, 625, NULL,          'pending',     40,   'guest',  'Booking created',        '2026-05-23 08:00:00'),
(713, 625, 'pending',     'confirmed',   37,   'host',   'Host accepted',           '2026-05-23 09:00:00'),
(714, 625, 'confirmed',   'in_progress', NULL, 'system', 'Check-in date reached',  '2026-05-25 14:00:00');

-- ============================================================
-- PAYMENT TRANSACTIONS
-- status enum: 'pending' | 'success' | 'failed'
-- ============================================================
INSERT INTO `payment_transactions` (
  `id`, `booking_id`, `type`, `amount`, `currency`,
  `gateway`, `gateway_reference`, `status`, `metadata`,
  `created_at`, `updated_at`
) VALUES
(900, 620, 'charge',         6615.00, 'EGP', 'opay', 'OPY-REF-620-001', 'success', '{"code":"00","message":"Approved"}',            '2026-02-05 09:05:00', '2026-02-05 09:05:00'),
(901, 621, 'charge',         6315.00, 'EGP', 'opay', 'OPY-REF-621-001', 'success', '{"code":"00","message":"Approved"}',            '2026-05-20 11:05:00', '2026-05-20 11:05:00'),
(902, 622, 'charge',         5115.00, 'EGP', 'opay', 'OPY-REF-622-001', 'pending', '{"code":"01","message":"Pending"}',             '2026-06-01 14:05:00', '2026-06-01 14:05:00'),
(903, 623, 'charge',         5355.00, 'EGP', 'opay', 'OPY-REF-623-001', 'success', '{"code":"00","message":"Approved"}',            '2026-02-20 10:05:00', '2026-02-20 10:05:00'),
(904, 623, 'refund',         5355.00, 'EGP', 'opay', 'OPY-REF-623-REF', 'success', '{"code":"00","message":"Refunded"}',            '2026-02-25 17:00:00', '2026-02-25 17:00:00'),
(905, 624, 'charge',         4095.00, 'EGP', 'opay', 'OPY-REF-624-001', 'success', '{"code":"00","message":"Approved"}',            '2026-03-25 09:05:00', '2026-03-25 09:05:00'),
(906, 624, 'partial_refund', 3600.00, 'EGP', 'opay', 'OPY-REF-624-REF', 'success', '{"code":"00","message":"Partially Refunded"}',  '2026-03-26 11:00:00', '2026-03-26 11:00:00'),
(907, 625, 'charge',         6315.00, 'EGP', 'opay', 'OPY-REF-625-001', 'success', '{"code":"00","message":"Approved"}',            '2026-05-23 08:05:00', '2026-05-23 08:05:00');

-- ============================================================
-- EARNINGS (host 37)
-- status enum: 'pending' | 'available' | 'paid'
-- ============================================================
INSERT INTO `earnings` (`id`, `host_id`, `booking_id`, `amount`, `platform_fee`, `currency`, `status`, `available_at`, `created_at`) VALUES
(300, 37, 620, 6615.00, 330.75, 'EGP', 'paid',      '2026-02-16 00:00:00', '2026-02-15 11:00:00'),
(301, 37, 621, 6315.00, 315.75, 'EGP', 'available', '2026-06-11 00:00:00', '2026-05-20 11:00:00'),
(302, 37, 625, 6315.00, 315.75, 'EGP', 'pending',   '2026-05-31 00:00:00', '2026-05-25 14:00:00');

-- ============================================================
-- PAYOUTS (host 37)
-- method enum: 'instapay' | 'bank_transfer' | 'cash'
-- status enum: 'pending' | 'processing' | 'completed' | 'failed'
-- ============================================================
INSERT INTO `payouts` (`id`, `host_id`, `amount`, `currency`, `method`, `status`, `note`, `transfer_reference`, `created_at`, `processed_at`) VALUES
(300, 37, 6284.25, 'EGP', 'bank_transfer', 'completed', 'March payout for booking 620', 'BANK-PAYOUT-300', '2026-02-28 10:00:00', '2026-03-01 14:00:00'),
(301, 37, 11999.25,'EGP', 'bank_transfer', 'pending',   'Pending payout for bookings 621 and 625', NULL,  '2026-05-31 10:00:00', NULL);

-- ============================================================
-- PAYOUT ITEMS
-- ============================================================
INSERT INTO `payout_items` (`id`, `payout_id`, `earning_id`, `booking_id`, `amount`, `created_at`) VALUES
(300, 300, 300, 620, 6284.25, '2026-02-28 10:00:00'),
(301, 301, 301, 621, 5999.25, '2026-05-31 10:00:00'),
(302, 301, 302, 625, 5999.25, '2026-05-31 10:00:00');

-- ============================================================
-- REVIEWS
-- reviewer_role enum: 'guest' | 'host'
-- ============================================================
INSERT INTO `reviews` (
  `id`, `booking_id`, `reviewer_id`, `reviewer_role`, `reviewed_user_id`,
  `property_id`, `overall_rating`, `cleanliness_rating`, `accuracy_rating`,
  `communication_rating`, `location_rating`, `value_rating`, `checkin_rating`,
  `comment`, `host_reply`, `host_replied_at`, `created_at`
) VALUES
(300, 620, 40, 'guest', NULL,
 300, 5, 5, 5, 5, 5, 5, 5,
 'Amazing apartment! Super clean, great location in Maadi, and the host was very responsive. Will definitely book again!',
 'Thank you for staying with us! We hope to welcome you back soon.',
 '2026-02-16 12:00:00', '2026-02-16 10:00:00'),
(301, 620, 37, 'host', 40,
 300, 5, NULL, NULL, 5, NULL, NULL, NULL,
 'Taha was an excellent guest. Very clean, communicative, and left the apartment in perfect condition. Highly recommended!',
 NULL, NULL, '2026-02-16 11:00:00');

-- ============================================================
-- CONVERSATIONS
-- ============================================================
INSERT INTO `conversations` (`id`, `property_id`, `booking_id`, `host_id`, `guest_id`, `created_at`) VALUES
(300, 300, 620, 37, 40, '2026-02-05 09:10:00'),
(301, 300, 621, 37, 40, '2026-05-20 11:00:00');

-- ============================================================
-- MESSAGES
-- message_type enum: 'text' | 'image'
-- ============================================================
INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `body`, `message_type`, `is_read`, `created_at`) VALUES
(700, 300, 40, 'Hi! I just completed my booking. Looking forward to staying with you!',                                                     'text', 1, '2026-02-05 09:10:00'),
(701, 300, 37, 'Welcome Taha! We are excited to host you. Please let me know if you have any questions before check-in.',                   'text', 1, '2026-02-05 10:00:00'),
(702, 300, 40, 'Will the parking be available for my car?',                                                                                  'text', 1, '2026-02-09 14:00:00'),
(703, 300, 37, 'Yes, we have one dedicated parking spot for guests. I will share the building access code on the day of check-in.',          'text', 1, '2026-02-09 15:00:00'),
(704, 300, 40, 'Thank you so much! See you tomorrow.',                                                                                       'text', 1, '2026-02-09 15:30:00'),
(705, 300, 40, 'Just checked out. It was a wonderful stay! Highly recommend!',                                                               'text', 1, '2026-02-15 11:30:00'),
(706, 300, 37, 'Thank you for being such a great guest! Come back anytime.',                                                                 'text', 1, '2026-02-15 12:00:00'),
(707, 301, 40, 'Hi! I have a booking for June 5-10. Is early check-in around 11am possible?',                                               'text', 1, '2026-05-20 11:00:00'),
(708, 301, 37, 'Hi Taha! Welcome back. I will try my best to have the apartment ready by 12pm. I will confirm closer to the date.',          'text', 1, '2026-05-20 11:30:00'),
(709, 301, 40, 'That works perfectly, thank you!',                                                                                           'text', 1, '2026-05-20 12:00:00');

-- ============================================================
-- NOTIFICATIONS
-- data_json must be valid JSON
-- ============================================================
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `title_ar`, `body`, `body_ar`, `data_json`, `is_read`, `created_at`) VALUES
(800, 37, 'booking_request',   'New Booking Request',  'طلب حجز جديد',        'Taha Moataz requested to book your property for Feb 10-15.', 'طلب تاها معتز حجز عقارك من 10 الى 15 فبراير.',      '{"bookingId":620,"propertyId":300}', 1, '2026-02-05 09:00:00'),
(801, 37, 'booking_completed', 'Booking Completed',    'اكتمل الحجز',         'Taha Moataz has checked out from your property.',            'غادر تاها معتز عقارك.',                              '{"bookingId":620,"propertyId":300}', 1, '2026-02-15 11:00:00'),
(802, 37, 'new_review',        'New Review Received',  'مراجعة جديدة',        'Taha Moataz left you a 5-star review!',                      'ترك تاها معتز تقييما بـ 5 نجوم!',                   '{"reviewId":300,"propertyId":300}',  1, '2026-02-16 10:00:00'),
(803, 37, 'booking_request',   'New Booking Request',  'طلب حجز جديد',        'Taha Moataz requested to book for Jun 5-10.',                'طلب تاها معتز الحجز من 5 الى 10 يونيو.',             '{"bookingId":621,"propertyId":300}', 1, '2026-05-20 11:00:00'),
(804, 37, 'payout_processed',  'Payout Processed',     'تمت معالجة الدفع',    'Your payout of EGP 6,284 has been processed.',              'تمت معالجة دفعتك بقيمة 6,284 جنيه.',                 '{"payoutId":300,"amount":6284}',     1, '2026-03-01 14:00:00'),
(805, 37, 'booking_request',   'New Booking Request',  'طلب حجز جديد',        'Taha Moataz requested to book for Jul 10-14.',               'طلب تاها معتز الحجز من 10 الى 14 يوليو.',            '{"bookingId":622,"propertyId":300}', 0, '2026-06-01 14:00:00'),
(806, 40, 'booking_confirmed', 'Booking Confirmed',    'تم تاكيد الحجز',      'Your booking for Modern Apartment in Maadi (Feb 10-15) is confirmed.', 'تم تاكيد حجزك للشقة الحديثة في المعادي (10-15 فبراير).', '{"bookingId":620,"propertyId":300}', 1, '2026-02-05 10:00:00'),
(807, 40, 'booking_reminder',  'Check-in Tomorrow',    'تسجيل الدخول غدا',    'Reminder: Your check-in at Modern Apartment in Maadi is tomorrow.', 'تذكير: موعد تسجيل دخولك في الشقة الحديثة بالمعادي هو غدا.', '{"bookingId":620,"propertyId":300}', 1, '2026-02-09 09:00:00'),
(808, 40, 'new_review',        'Review from Host',     'تقييم من المضيف',     'Oikivo Support left you a review after your stay.',          'ترك لك دعم اويكيفو تقييما بعد اقامتك.',              '{"reviewId":301}',                  1, '2026-02-16 11:00:00'),
(809, 40, 'booking_confirmed', 'Booking Confirmed',    'تم تاكيد الحجز',      'Your booking for Jun 5-10 has been confirmed!',              'تم تاكيد حجزك من 5 الى 10 يونيو!',                  '{"bookingId":621,"propertyId":300}', 1, '2026-05-20 11:30:00'),
(810, 40, 'booking_declined',  'Booking Declined',     'تم رفض الحجز',        'Your booking request for Apr 1-4 was declined by the host.', 'تم رفض طلب حجزك من 1 الى 4 ابريل من قبل المضيف.',   '{"bookingId":624,"propertyId":300}', 1, '2026-03-26 10:00:00'),
(811, 40, 'refund_issued',     'Refund Issued',        'تم اصدار الاسترداد',  'A refund of EGP 3,600 has been issued for your cancelled booking.', 'تم اصدار استرداد بقيمة 3,600 جنيه لحجزك الملغى.', '{"bookingId":624,"transactionId":906}', 1, '2026-03-26 11:30:00'),
(812, 40, 'booking_in_progress','Stay Started',        'بدات الاقامة',        'Your stay at Modern Apartment in Maadi has started. Enjoy!', 'بدات اقامتك في الشقة الحديثة بالمعادي. استمتع!',    '{"bookingId":625,"propertyId":300}', 1, '2026-05-25 14:00:00');

-- ============================================================
-- DISPUTES
-- category enum: 'property_not_as_described'|'no_show'|'safety_concern'|
--                'refund_request'|'damage_claim'|'other'
-- status enum: 'open'|'under_review'|'resolved'|'closed'
-- resolution enum: 'resolved_for_guest'|'resolved_for_host'|'dismissed'|'split'
-- ============================================================
INSERT INTO `disputes` (
  `id`, `uuid`, `booking_id`, `raised_by_id`,
  `category`, `title`, `description`,
  `status`, `resolution`, `admin_note`, `priority`,
  `created_at`, `updated_at`
) VALUES
(300, 'dispute-0001-open',     625, 40,
 'property_not_as_described',
 'AC not working and balcony blocked',
 'The air conditioning in the second bedroom was not working and the photos showed a balcony that was blocked with storage items.',
 'open', NULL, NULL, 'medium',
 '2026-05-27 10:00:00', '2026-05-27 10:00:00'),
(301, 'dispute-0002-resolved', 623, 40,
 'refund_request',
 'Full refund requested due to medical emergency',
 'Guest requested full refund due to emergency medical situation. Cancellation was outside the free cancellation window.',
 'resolved', 'resolved_for_guest',
 'Full refund granted as goodwill given medical emergency documentation.',
 'low',
 '2026-02-25 16:30:00', '2026-02-26 09:00:00');

-- ============================================================
-- WISHLISTS + WISHLIST ITEMS (user 40)
-- ============================================================
INSERT INTO `wishlists` (`id`, `uuid`, `user_id`, `name`, `visibility`, `share_token`, `cover_photo`, `created_at`) VALUES
(300, 'wish-0001-cairo-fav',   40, 'Cairo Favorites', 'private', 'share-tok-0001-cairo',  NULL, '2026-01-05 10:00:00'),
(301, 'wish-0002-great-apts',  40, 'Great Apartments', 'public',  'share-tok-0002-public', NULL, '2026-02-10 12:00:00');

INSERT INTO `wishlist_items` (`id`, `wishlist_id`, `property_id`, `added_at`) VALUES
(300, 300, 300, '2026-01-10 11:00:00'),
(301, 300, 261, '2026-01-12 09:00:00'),
(302, 301, 300, '2026-02-11 10:00:00');

-- ============================================================
-- PRICE ALERTS (user 40)
-- ============================================================
INSERT INTO `price_alerts` (`id`, `user_id`, `property_id`, `target_price`, `last_known_price`, `active`, `notified_at`, `created_at`) VALUES
(300, 40, 300,  900.00, 1200.00, 1, NULL, '2026-01-15 10:00:00'),
(301, 40, 261, 1500.00,  500.00, 1, NULL, '2026-02-01 09:00:00');

-- ============================================================
-- SAVED SEARCHES (user 40)
-- ============================================================
INSERT INTO `saved_searches` (`id`, `user_id`, `name`, `filters`, `alert_enabled`, `last_alerted_at`, `created_at`) VALUES
(300, 40, 'Cairo Apartments',
 '{"city":"Cairo","property_kind":"apartment","max_price":2000,"min_bedrooms":2,"guests":2}',
 1, NULL, '2026-01-10 10:00:00'),
(301, 40, 'Maadi Budget Stay',
 '{"city":"Cairo","district":"Maadi","max_price":1500,"space_type":"entire_place"}',
 0, NULL, '2026-02-05 08:00:00');

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
-- END OF DUMMY DATA
-- ============================================================