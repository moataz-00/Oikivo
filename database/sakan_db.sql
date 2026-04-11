-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 10, 2026 at 03:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sakan_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_activity_logs`
--

CREATE TABLE `admin_activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `admin_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(120) NOT NULL,
  `entity_type` varchar(60) DEFAULT NULL,
  `entity_id` varchar(60) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_activity_logs`
--

INSERT INTO `admin_activity_logs` (`id`, `admin_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 15, 'PATCH /users/:id/toggle-active', 'users', '17', NULL, '::1', '2026-04-06 21:15:34'),
(2, 15, 'PATCH /settings/property_host_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-06 22:08:58'),
(3, 15, 'PATCH /settings/property_guest_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-06 22:09:01'),
(4, 15, 'POST /notifications/blast', 'notifications', NULL, NULL, '::1', '2026-04-06 22:15:08');

-- --------------------------------------------------------

--
-- Table structure for table `amenities`
--

CREATE TABLE `amenities` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_ar` varchar(100) NOT NULL,
  `icon` varchar(100) NOT NULL,
  `category` enum('essential','standout','safety') NOT NULL DEFAULT 'essential',
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `amenities`
--

INSERT INTO `amenities` (`id`, `name`, `name_ar`, `icon`, `category`, `sort_order`) VALUES
(1, 'WiFi', 'واي فاي', 'wifi', 'essential', 1),
(2, 'Kitchen', 'مطبخ', 'cooking-pot', 'essential', 2),
(3, 'Free parking', 'موقف مجاني', 'square-parking', 'essential', 3),
(4, 'Air conditioning', 'تكييف', 'air-vent', 'essential', 4),
(5, 'Heating', 'تدفئة', 'flame', 'essential', 5),
(6, 'Washing machine', 'غسالة', 'washing-machine', 'essential', 6),
(7, 'Dryer', 'مجفف ملابس', 'wind', 'essential', 7),
(8, 'Dedicated workspace', 'مساحة عمل', 'briefcase', 'essential', 8),
(9, 'TV', 'تلفزيون', 'tv', 'essential', 9),
(10, 'Hair dryer', 'مجفف شعر', 'zap', 'essential', 10),
(11, 'Pool', 'حمام سباحة', 'waves', 'standout', 1),
(12, 'Hot tub', 'حوض استحمام ساخن', 'thermometer', 'standout', 2),
(13, 'Gym', 'صالة رياضية', 'dumbbell', 'standout', 3),
(14, 'BBQ grill', 'شواية', 'flame', 'standout', 4),
(15, 'Beach access', 'وصول للشاطئ', 'anchor', 'standout', 5),
(16, 'Ski-in/ski-out', 'تزلج', 'mountain', 'standout', 6),
(17, 'Piano', 'بيانو', 'music', 'standout', 7),
(18, 'Outdoor shower', 'دش خارجي', 'shower-head', 'standout', 8),
(19, 'Bikes', 'دراجات هوائية', 'bike', 'standout', 9),
(20, 'Lake access', 'وصول للبحيرة', 'sailboat', 'standout', 10),
(21, 'Smoke alarm', 'كاشف دخان', 'bell-ring', 'safety', 1),
(22, 'Carbon monoxide alarm', 'كاشف أول أكسيد الكربون', 'alert-triangle', 'safety', 2),
(23, 'Fire extinguisher', 'طفاية حريق', 'fire-extinguisher', 'safety', 3),
(24, 'First aid kit', 'إسعافات أولية', 'cross', 'safety', 4),
(25, 'Security cameras', 'كاميرات أمان', 'camera', 'safety', 5),
(26, 'Deadbolt lock', 'قفل آمن', 'lock', 'safety', 6);

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `actor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `event_type`, `actor_id`, `entity_type`, `entity_id`, `metadata`, `ip_address`, `created_at`) VALUES
(1, 'booking.created', 17, 'booking', 36, '{\"propertyId\":161,\"checkIn\":\"2026-04-08\",\"checkOut\":\"2026-04-11\",\"totalAmount\":1194.4,\"status\":\"confirmed\"}', NULL, '2026-04-06 01:03:39.990776'),
(2, 'payment.submitted', 17, 'booking', 36, '{\"method\":\"instapay\",\"reference\":\"zxcvxxcvbcvnbvnvmn\"}', NULL, '2026-04-06 01:04:10.458728'),
(3, 'payment.confirmed', 0, 'booking', 36, '{\"isAdmin\":true,\"totalAmount\":1194.4,\"method\":\"instapay\"}', NULL, '2026-04-06 01:05:40.161588'),
(4, 'booking.cancelled', 17, 'booking', 36, '{\"cancelledBy\":\"guest\",\"refundAmount\":3300,\"policy\":\"flexible\"}', NULL, '2026-04-06 01:11:12.502690'),
(5, 'payment.refunded', NULL, 'booking', 36, '{\"method\":\"instapay\",\"refundAmount\":3300}', NULL, '2026-04-06 01:12:26.390838');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_uuid` varchar(36) NOT NULL,
  `short_code` varchar(12) DEFAULT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `guest_id` bigint(20) UNSIGNED NOT NULL,
  `host_id` bigint(20) UNSIGNED NOT NULL,
  `check_in` date NOT NULL,
  `check_out` date NOT NULL,
  `guests_count` int(11) NOT NULL DEFAULT 1,
  `nights` int(11) NOT NULL DEFAULT 1,
  `base_amount` decimal(10,2) NOT NULL,
  `cleaning_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `service_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `taxes` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `deposit_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deposit_status` enum('none','held','claimed','released') NOT NULL DEFAULT 'none',
  `deposit_claim_deadline` datetime DEFAULT NULL,
  `deposit_released_at` datetime DEFAULT NULL,
  `deposit_claim_reason` text DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `status` enum('pending','confirmed','in_progress','completed','cancelled','declined') NOT NULL DEFAULT 'pending',
  `house_rules_acknowledged` tinyint(1) DEFAULT 0,
  `house_rules_acknowledged_at` datetime DEFAULT NULL,
  `payment_status` enum('pending','submitted','paid','refunded','declined') NOT NULL DEFAULT 'pending',
  `payment_method` enum('instapay','cash','card','stripe','opay-card','opay-wallet') DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `payment_note` text DEFAULT NULL,
  `payment_proof_url` varchar(500) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL COMMENT 'Stripe PaymentIntent ID for card payments',
  `stripe_refund_id` varchar(255) DEFAULT NULL,
  `opay_order_reference` varchar(100) DEFAULT NULL,
  `cancellation_reason` varchar(1000) DEFAULT NULL,
  `cancellation_policy` enum('flexible','moderate','strict') DEFAULT NULL COMMENT 'Snapshot of property policy at booking time',
  `refund_amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Amount refunded to guest',
  `cancellation_fee` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Fee retained (host payout + platform retention)',
  `cancelled_at` datetime DEFAULT NULL COMMENT 'Exact timestamp of cancellation',
  `cancelled_by` enum('guest','host','admin','system') DEFAULT NULL COMMENT 'Who initiated the cancellation',
  `guest_note` varchar(2000) DEFAULT NULL,
  `special_requests` varchar(2000) DEFAULT NULL,
  `refund_reason` varchar(500) DEFAULT NULL,
  `modification_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`modification_history`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `booking_uuid`, `short_code`, `property_id`, `guest_id`, `host_id`, `check_in`, `check_out`, `guests_count`, `nights`, `base_amount`, `cleaning_fee`, `service_fee`, `taxes`, `total_amount`, `deposit_amount`, `deposit_status`, `deposit_claim_deadline`, `deposit_released_at`, `deposit_claim_reason`, `currency`, `status`, `house_rules_acknowledged`, `house_rules_acknowledged_at`, `payment_status`, `payment_method`, `payment_reference`, `payment_note`, `payment_proof_url`, `stripe_payment_intent_id`, `stripe_refund_id`, `opay_order_reference`, `cancellation_reason`, `cancellation_policy`, `refund_amount`, `cancellation_fee`, `cancelled_at`, `cancelled_by`, `guest_note`, `special_requests`, `refund_reason`, `modification_history`, `created_at`, `updated_at`) VALUES
(20, '501e4d74-e1df-412f-a5bf-9aa78cc8558b', NULL, 226, 10, 3, '2026-03-23', '2026-03-24', 1, 1, 195.00, 50.00, 27.30, 0.00, 272.30, 0.00, 'none', NULL, NULL, NULL, 'EUR', 'completed', 0, NULL, 'paid', 'stripe', NULL, NULL, NULL, 'pi_3TEGRfFafnnWoUIK1oSqb3Lp', NULL, NULL, NULL, 'flexible', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-23 23:55:31', '2026-03-27 21:22:14'),
(28, 'b4bafcdd-4712-41b5-b464-db2fa820a3cc', NULL, 165, 17, 3, '2026-03-27', '2026-03-31', 1, 4, 240.00, 20.00, 33.60, 0.00, 293.60, 0.00, 'none', NULL, NULL, NULL, 'USD', 'completed', 0, NULL, 'paid', 'opay-card', NULL, NULL, NULL, NULL, NULL, 'js-s-28-mn8z3c46', NULL, 'flexible', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-27 15:59:55', '2026-03-27 20:33:57'),
(29, 'b7a381fb-c7a3-49ff-aef2-31d8ac3e7a6f', NULL, 165, 17, 3, '2026-03-31', '2026-04-03', 1, 3, 180.00, 20.00, 25.20, 0.00, 225.20, 0.00, 'none', NULL, NULL, NULL, 'USD', 'completed', 0, NULL, 'refunded', 'opay-card', NULL, NULL, NULL, NULL, NULL, 'js-s-29-mn8zm0vm', NULL, 'flexible', 180.00, 45.20, '2026-03-27 14:20:12', 'guest', NULL, NULL, NULL, NULL, '2026-03-27 16:18:12', '2026-03-27 20:34:03'),
(30, 'db6f55b4-1ce8-418d-9969-f24fe6f76a76', NULL, 232, 10, 17, '2026-03-29', '2026-03-31', 1, 2, 200.00, 0.00, 28.00, 0.00, 228.00, 5000.00, 'claimed', '2026-04-02 00:00:00', NULL, 'ferter', 'USD', 'completed', 0, NULL, 'paid', 'opay-card', NULL, NULL, NULL, NULL, NULL, 'js-s-30-mnafea9o', NULL, 'flexible', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 16:27:30', '2026-03-28 16:31:00'),
(31, '55dc955c-ee59-4753-898d-e518edf223bf', NULL, 162, 17, 3, '2026-03-28', '2026-03-31', 1, 3, 135.00, 10.00, 18.90, 0.00, 163.90, 0.00, 'none', NULL, NULL, NULL, 'USD', 'confirmed', 0, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'flexible', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 16:46:51', '2026-03-28 16:46:51'),
(32, '54f53776-8a97-4f6f-91c2-baaf0f31d653', NULL, 162, 17, 3, '2026-03-31', '2026-04-01', 1, 1, 45.00, 10.00, 6.30, 0.00, 61.30, 0.00, 'none', NULL, NULL, NULL, 'USD', 'confirmed', 0, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'flexible', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 16:48:14', '2026-03-28 16:48:14'),
(33, 'e78381f9-c132-4fd1-bdd1-9830b9cbabda', NULL, 165, 17, 3, '2026-03-31', '2026-04-01', 1, 1, 60.00, 20.00, 8.40, 0.00, 88.40, 0.00, 'none', NULL, NULL, NULL, 'USD', 'confirmed', 0, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'flexible', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 17:14:13', '2026-03-28 17:14:13'),
(34, '946ea2ff-9d5f-4e71-b972-473e18ce6997', NULL, 165, 17, 3, '2026-04-01', '2026-04-04', 1, 3, 180.00, 20.00, 25.20, 0.00, 225.20, 0.00, 'none', NULL, NULL, NULL, 'USD', 'confirmed', 0, NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'flexible', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 17:28:47', '2026-03-28 17:28:47'),
(35, '061f4876-563d-43ef-b13f-85bc6f811b58', NULL, 165, 10, 3, '2026-04-04', '2026-04-16', 1, 12, 720.00, 20.00, 100.80, 0.00, 840.80, 0.00, 'none', NULL, NULL, NULL, 'USD', 'confirmed', 0, NULL, 'declined', 'instapay', '232456575788678', 'Auto-declined: no admin action within 48 hours', 'http://localhost:3001/uploads/payments/35/proof-1774713623188.png', NULL, NULL, NULL, NULL, 'flexible', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28 17:49:52', '2026-04-03 17:00:00'),
(36, '055183fe-2154-473f-975d-453abd402038', NULL, 161, 17, 2, '2026-04-08', '2026-04-18', 1, 10, 3200.00, 100.00, 448.00, 0.00, 3748.00, 0.00, 'none', NULL, NULL, NULL, 'USD', 'cancelled', 0, NULL, 'refunded', 'instapay', 'zxcvxxcvbcvnbvnvmn', NULL, 'http://localhost:3001/uploads/payments/36/proof-1775430250393.png', NULL, NULL, NULL, NULL, 'flexible', 3300.00, 448.00, '2026-04-05 23:11:12', 'guest', NULL, NULL, NULL, '[{\"changedAt\":\"2026-04-05T23:10:34.918Z\",\"changedBy\":\"guest\",\"changes\":[{\"field\":\"checkOut\",\"from\":\"2026-04-11\",\"to\":\"2026-04-18\"},{\"field\":\"totalAmount\",\"from\":1194.4,\"to\":3748}]}]', '2026-04-06 01:03:39', '2026-04-06 01:12:26');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_ar` varchar(100) NOT NULL,
  `icon` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `name_ar`, `icon`, `description`, `sort_order`, `is_active`) VALUES
(1, 'Beachfront', 'على الشاطئ', '🏖️', 'Properties right on the water', 1, 1),
(2, 'Countryside', 'الريف', '🌾', 'Rural and country escapes', 2, 1),
(3, 'Amazing pools', 'مسابح رائعة', '🏊', 'Properties with standout pools', 3, 1),
(4, 'Cabins', 'كابن', '🪵', 'Cozy cabin getaways', 4, 1),
(5, 'Tiny homes', 'منازل صغيرة', '🏠', 'Compact and charming tiny homes', 5, 1),
(6, 'Luxe', 'فاخر', '💎', 'Extraordinary luxury properties', 6, 1),
(7, 'Icons', 'أيقونات', '🗺️', 'World-famous, one-of-a-kind properties', 7, 1),
(8, 'Rooms', 'غرف', '🛏️', 'Private rooms in shared homes', 8, 1),
(9, 'Mansions', 'قصور', '🏰', 'Grand and spacious mansions', 9, 1),
(10, 'Top of the world', 'قمة العالم', '⛰️', 'Stunning mountaintop properties', 10, 1),
(11, 'Amazing views', 'إطلالات رائعة', '🌄', 'Properties with breathtaking views', 11, 1),
(12, 'Camping', 'تخييم', '⛺', 'Camping and outdoor experiences', 12, 1),
(13, 'Desert', 'الصحراء', '🌵', 'Desert and arid landscape stays', 13, 1),
(14, 'Tropical', 'استوائي', '🌴', 'Tropical and lush paradise', 14, 1),
(15, 'Historical', 'تاريخي', '🏛️', 'Properties steeped in history', 15, 1);

-- --------------------------------------------------------

--
-- Table structure for table `cohosts`
--

CREATE TABLE `cohosts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `host_id` bigint(20) UNSIGNED NOT NULL,
  `cohost_id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('co_host','cleaner') NOT NULL DEFAULT 'co_host',
  `status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cohosts`
--

INSERT INTO `cohosts` (`id`, `property_id`, `host_id`, `cohost_id`, `role`, `status`, `created_at`) VALUES
(3, 231, 17, 10, 'co_host', 'accepted', '2026-03-28 12:16:49');

-- --------------------------------------------------------

--
-- Table structure for table `consultants`
--

CREATE TABLE `consultants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` char(36) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `display_name` varchar(120) NOT NULL,
  `bio` text DEFAULT NULL,
  `specializations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '["pricing","interior_design","guest_experience","listing_optimization","photography","superhost_coaching","multi-property_management"]' CHECK (json_valid(`specializations`)),
  `years_experience` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `languages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '["en","ar"]' CHECK (json_valid(`languages`)),
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) NOT NULL DEFAULT 'EGP',
  `avg_rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `total_sessions` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `timezone` varchar(50) NOT NULL DEFAULT 'UTC',
  `payout_method` enum('instapay','bank_transfer') DEFAULT NULL,
  `payout_account_details` varchar(300) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consultants`
--

INSERT INTO `consultants` (`id`, `uuid`, `user_id`, `display_name`, `bio`, `specializations`, `years_experience`, `languages`, `hourly_rate`, `currency`, `avg_rating`, `review_count`, `total_sessions`, `status`, `rejection_reason`, `approved_at`, `is_featured`, `timezone`, `payout_method`, `payout_account_details`, `created_at`, `updated_at`) VALUES
(4, '4590befc-96b1-4c48-9c01-26123495a8f6', 10, 'xczxcx', 'zxcxzcxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '[\"pricing_strategy\"]', 2, '[\"ar\"]', 66.00, 'EGP', 0.00, 0, 0, 'approved', NULL, '2026-04-03 19:24:32', 0, 'UTC', NULL, NULL, '2026-04-03 21:23:40', '2026-04-03 21:24:32'),
(5, '01d4f69e-358c-4efd-8db0-40f6381a1260', 17, 'tygkjkm', '', '[\"property_management\",\"pricing_strategy\"]', 1, '[]', 0.00, 'EGP', 0.00, 0, 0, 'approved', NULL, '2026-04-03 19:55:33', 0, 'UTC', NULL, NULL, '2026-04-03 21:55:09', '2026-04-04 14:25:18');

-- --------------------------------------------------------

--
-- Table structure for table `consultant_availability`
--

CREATE TABLE `consultant_availability` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `consultant_id` bigint(20) UNSIGNED NOT NULL,
  `day_of_week` tinyint(3) UNSIGNED NOT NULL COMMENT '0=Sun..6=Sat',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consultant_availability`
--

INSERT INTO `consultant_availability` (`id`, `consultant_id`, `day_of_week`, `start_time`, `end_time`, `is_active`) VALUES
(8, 5, 0, '09:00:00', '17:00:00', 1),
(9, 5, 1, '09:00:00', '17:00:00', 1);

-- --------------------------------------------------------

--
-- Table structure for table `consultant_documents`
--

CREATE TABLE `consultant_documents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `consultant_id` bigint(20) UNSIGNED NOT NULL,
  `document_type` enum('hospitality_certificate','business_license','superhost_proof','portfolio','other','national_id','profile_photo') NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `consultant_documents`
--

INSERT INTO `consultant_documents` (`id`, `consultant_id`, `document_type`, `file_url`, `original_name`, `status`, `admin_note`, `uploaded_at`) VALUES
(3, 4, '', '/uploads/consultant-docs/10/doc-1775244220071-294203072.png', 'logo-removebg-preview (1).png', 'pending', NULL, '2026-04-03 21:23:40'),
(4, 4, '', '/uploads/consultant-docs/10/doc-1775244220075-972493622.png', 'logo-removebg-preview__1_-removebg-preview.png', 'pending', NULL, '2026-04-03 21:23:40'),
(5, 5, '', '/uploads/consultant-docs/17/doc-1775246109568-834636855.png', 'logo-removebg-preview__1_-removebg-preview.png', 'pending', NULL, '2026-04-03 21:55:09'),
(6, 5, '', '/uploads/consultant-docs/17/doc-1775246109569-530163725.png', 'logo-removebg-preview.png', 'pending', NULL, '2026-04-03 21:55:09');

-- --------------------------------------------------------

--
-- Table structure for table `consultant_earnings`
--

CREATE TABLE `consultant_earnings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `consultant_id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `payout_request_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `platform_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'EGP',
  `status` enum('hold','available','paid','refunded') NOT NULL DEFAULT 'hold',
  `available_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultant_payout_requests`
--

CREATE TABLE `consultant_payout_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `consultant_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EGP',
  `method` enum('instapay','bank_transfer') NOT NULL DEFAULT 'instapay',
  `account_details` varchar(500) DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultant_vacation_blocks`
--

CREATE TABLE `consultant_vacation_blocks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `consultant_id` bigint(20) UNSIGNED NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultation_bookings`
--

CREATE TABLE `consultation_bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` char(36) NOT NULL,
  `consultant_id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED NOT NULL COMMENT 'The host seeking help',
  `scheduled_at` datetime NOT NULL,
  `duration_minutes` int(10) UNSIGNED NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `platform_fee` decimal(10,2) NOT NULL,
  `consultant_payout` decimal(10,2) NOT NULL,
  `client_timezone` varchar(50) NOT NULL DEFAULT 'UTC',
  `currency` varchar(3) NOT NULL DEFAULT 'EGP',
  `status` enum('pending','confirmed','in_progress','completed','cancelled','no_show','disputed') NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','submitted','paid','refunded','hold','refund_pending') NOT NULL DEFAULT 'pending',
  `payment_method` enum('card','instapay','wallet') NOT NULL DEFAULT 'card',
  `meeting_link` varchar(500) DEFAULT NULL,
  `client_note` text DEFAULT NULL,
  `consultant_note` text DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `payment_proof_url` varchar(500) DEFAULT NULL,
  `refund_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cancellation_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pre_session_reminder_sent` tinyint(1) NOT NULL DEFAULT 0,
  `payment_reminder_sent` tinyint(1) NOT NULL DEFAULT 0,
  `original_scheduled_at` datetime DEFAULT NULL,
  `delivery_mode` enum('video_call','phone','in_person','chat') NOT NULL DEFAULT 'video_call',
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_by` enum('client','consultant','admin') DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `client_confirmed_at` datetime DEFAULT NULL,
  `payment_deadline` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `consultation_reviews`
--

CREATE TABLE `consultation_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `reviewer_id` bigint(20) UNSIGNED NOT NULL COMMENT 'The client leaving the review',
  `consultant_id` bigint(20) UNSIGNED NOT NULL,
  `overall_rating` tinyint(3) UNSIGNED NOT NULL COMMENT '1-5',
  `expertise_rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `communication_rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `value_rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `consultant_reply` text DEFAULT NULL,
  `consultant_replied_at` datetime DEFAULT NULL,
  `is_hidden` tinyint(1) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `consultation_reviews`
--
DELIMITER $$
CREATE TRIGGER `trg_consultation_review_insert` AFTER INSERT ON `consultation_reviews` FOR EACH ROW BEGIN
  UPDATE consultants SET
    avg_rating = (
      SELECT COALESCE(AVG(overall_rating), 0) FROM consultation_reviews WHERE consultant_id = NEW.consultant_id
    ),
    review_count = (
      SELECT COUNT(*) FROM consultation_reviews WHERE consultant_id = NEW.consultant_id
    )
  WHERE id = NEW.consultant_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED DEFAULT NULL,
  `booking_id` bigint(20) UNSIGNED DEFAULT NULL,
  `host_id` bigint(20) UNSIGNED NOT NULL,
  `guest_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id`, `property_id`, `booking_id`, `host_id`, `guest_id`, `created_at`, `updated_at`) VALUES
(5, 165, NULL, 17, 3, '2026-03-27 19:21:15', '2026-03-27 15:21:15'),
(6, NULL, NULL, 17, 2, '2026-03-28 12:14:46', '2026-03-28 08:14:46');

-- --------------------------------------------------------

--
-- Table structure for table `disputes`
--

CREATE TABLE `disputes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `raised_by_id` bigint(20) UNSIGNED NOT NULL,
  `category` enum('property_not_as_described','no_show','safety_concern','refund_request','damage_claim','other') NOT NULL DEFAULT 'other',
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `status` enum('open','under_review','resolved','closed') NOT NULL DEFAULT 'open',
  `resolution` enum('resolved_for_guest','resolved_for_host','dismissed','split') DEFAULT NULL,
  `admin_note` text DEFAULT NULL,
  `additional_info` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `disputes`
--

INSERT INTO `disputes` (`id`, `booking_id`, `raised_by_id`, `category`, `title`, `description`, `status`, `resolution`, `admin_note`, `additional_info`, `resolved_at`, `created_at`, `updated_at`) VALUES
(1, 29, 17, 'property_not_as_described', 'dsdfgsdfsdf', 'dfgdfghfghfgdfgdfhfhfghgfdsdfsdfgdfhdfghfgh', 'under_review', NULL, NULL, NULL, NULL, '2026-03-27 16:24:52', '2026-03-27 18:34:58');

-- --------------------------------------------------------

--
-- Table structure for table `earnings`
--

CREATE TABLE `earnings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `host_id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `platform_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'EGP',
  `status` enum('pending','available','paid') NOT NULL DEFAULT 'pending',
  `available_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `earnings`
--

INSERT INTO `earnings` (`id`, `host_id`, `booking_id`, `amount`, `platform_fee`, `currency`, `status`, `available_at`, `created_at`) VALUES
(1, 17, 30, 200.00, 28.00, 'EGP', 'pending', '2026-04-01 00:00:00', '2026-03-28 16:31:18');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `description` varchar(500) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EGP',
  `category` varchar(100) DEFAULT NULL,
  `date` date NOT NULL,
  `added_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experiences`
--

CREATE TABLE `experiences` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(36) DEFAULT NULL,
  `host_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `what_well_do` text DEFAULT NULL COMMENT 'What guests will experience',
  `what_i_will_provide` text DEFAULT NULL COMMENT 'Items provided by host',
  `guest_requirements` text DEFAULT NULL COMMENT 'Fitness level, age, etc.',
  `language` varchar(50) DEFAULT 'English',
  `duration_minutes` int(11) NOT NULL DEFAULT 120 COMMENT 'Total duration in minutes',
  `max_guests` int(11) NOT NULL DEFAULT 10,
  `min_guests` int(11) NOT NULL DEFAULT 1,
  `price_per_person` decimal(10,2) NOT NULL,
  `group_discount_percent` decimal(5,2) DEFAULT 0.00 COMMENT 'Discount for 5+ guests',
  `city` varchar(150) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `country` varchar(150) DEFAULT 'Egypt',
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `meeting_point` text DEFAULT NULL COMMENT 'Where to meet guests',
  `instant_book` tinyint(1) DEFAULT 0,
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `avg_rating` decimal(3,2) DEFAULT 0.00,
  `review_count` int(11) DEFAULT 0,
  `total_bookings` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `archived_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experience_bookings`
--

CREATE TABLE `experience_bookings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `experience_id` bigint(20) UNSIGNED NOT NULL,
  `guest_id` bigint(20) UNSIGNED NOT NULL,
  `host_id` bigint(20) UNSIGNED NOT NULL,
  `booking_date` date NOT NULL COMMENT 'The date of the experience',
  `start_time` time NOT NULL COMMENT 'Start time of the session',
  `guests_count` int(11) NOT NULL DEFAULT 1,
  `price_per_person` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL COMMENT 'price_per_person * guests_count',
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `service_fee` decimal(10,2) DEFAULT 0.00 COMMENT '14% guest service fee',
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled','declined') DEFAULT 'pending',
  `payment_status` enum('pending','submitted','paid','refunded') DEFAULT 'pending',
  `payment_method` enum('instapay','cash','card','stripe','opay-card','opay-wallet') DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `payment_proof_url` varchar(500) DEFAULT NULL,
  `stripe_payment_intent_id` varchar(255) DEFAULT NULL COMMENT 'Stripe PaymentIntent ID for card payments',
  `opay_order_reference` varchar(100) DEFAULT NULL,
  `guest_note` text DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experience_categories`
--

CREATE TABLE `experience_categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `experience_categories`
--

INSERT INTO `experience_categories` (`id`, `name`, `slug`, `icon`, `description`, `display_order`, `created_at`) VALUES
(1, 'Food & Drink', 'food-drink', '🍳', 'Cooking classes, food tours, and tastings', 1, '2026-03-21 18:59:36'),
(2, 'Culture & History', 'culture-history', '🏛️', 'Historical tours, museum visits, and cultural immersions', 2, '2026-03-21 18:59:36'),
(3, 'Nature & Outdoors', 'nature-outdoors', '🌿', 'Desert safaris, diving, hiking, and nature walks', 3, '2026-03-21 18:59:36'),
(4, 'Art & Creativity', 'art-creativity', '🎨', 'Pottery, painting, calligraphy, and crafts', 4, '2026-03-21 18:59:36'),
(5, 'Music & Dance', 'music-dance', '🎵', 'Traditional music, dance classes, and performances', 5, '2026-03-21 18:59:36'),
(6, 'Sports & Wellness', 'sports-wellness', '🧘', 'Yoga, fitness, meditation, and sports', 6, '2026-03-21 18:59:36'),
(7, 'Nightlife', 'nightlife', '🌙', 'Night tours, rooftop experiences, and evening events', 7, '2026-03-21 18:59:36'),
(8, 'Shopping & Fashion', 'shopping-fashion', '🛍️', 'Market tours, bazaar experiences, and artisan workshops', 8, '2026-03-21 18:59:36'),
(9, 'Photography', 'photography', '📸', 'Photo walks, portrait sessions, and scenic tours', 9, '2026-03-21 18:59:36'),
(10, 'Social Impact', 'social-impact', '🤝', 'Community projects, volunteering, and social enterprises', 10, '2026-03-21 18:59:36');

-- --------------------------------------------------------

--
-- Table structure for table `experience_date_overrides`
--

CREATE TABLE `experience_date_overrides` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `experience_id` bigint(20) UNSIGNED NOT NULL,
  `override_date` date NOT NULL,
  `is_blocked` tinyint(1) DEFAULT 0 COMMENT '1=blocked, 0=available with override_time',
  `override_time` time DEFAULT NULL,
  `max_guests_override` int(11) DEFAULT NULL,
  `price_override` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experience_itinerary`
--

CREATE TABLE `experience_itinerary` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `experience_id` bigint(20) UNSIGNED NOT NULL,
  `step_number` int(11) NOT NULL DEFAULT 1,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL COMMENT 'Duration for this step'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experience_photos`
--

CREATE TABLE `experience_photos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `experience_id` bigint(20) UNSIGNED NOT NULL,
  `url` varchar(500) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_cover` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experience_reviews`
--

CREATE TABLE `experience_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `reviewer_id` bigint(20) UNSIGNED NOT NULL,
  `experience_id` bigint(20) UNSIGNED NOT NULL,
  `overall_rating` tinyint(3) UNSIGNED NOT NULL,
  `host_rating` tinyint(3) UNSIGNED DEFAULT NULL COMMENT 'How knowledgeable/engaging was the host',
  `value_rating` tinyint(3) UNSIGNED DEFAULT NULL COMMENT 'Was it worth the price',
  `activity_rating` tinyint(3) UNSIGNED DEFAULT NULL COMMENT 'How fun/engaging was the activity',
  `comment` text DEFAULT NULL,
  `host_reply` text DEFAULT NULL,
  `host_replied_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `experience_schedule`
--

CREATE TABLE `experience_schedule` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `experience_id` bigint(20) UNSIGNED NOT NULL,
  `day_of_week` tinyint(3) UNSIGNED NOT NULL COMMENT '0=Sun,1=Mon,...,6=Sat',
  `start_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `conversation_id` bigint(20) UNSIGNED NOT NULL,
  `sender_id` bigint(20) UNSIGNED NOT NULL,
  `body` text NOT NULL,
  `message_type` enum('text','image') NOT NULL DEFAULT 'text',
  `image_url` varchar(500) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `body`, `message_type`, `image_url`, `is_read`, `created_at`) VALUES
(10, 5, 17, 'kkk', 'text', NULL, 0, '2026-03-27 19:21:15'),
(11, 6, 17, 'hi', 'text', NULL, 0, '2026-03-28 12:14:46');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(60) NOT NULL,
  `title` varchar(255) NOT NULL,
  `title_ar` varchar(255) DEFAULT NULL,
  `body` text NOT NULL,
  `body_ar` text DEFAULT NULL,
  `data_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data_json`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `title_ar`, `body`, `body_ar`, `data_json`, `is_read`, `created_at`) VALUES
(1, 2, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Stunning Nile View Apartment in Cairo', 'لديك طلب حجز جديد لـ Stunning Nile View Apartment in Cairo', '{\"bookingId\":\"3\",\"propertyId\":1}', 1, '2026-03-17 01:21:28'),
(2, 2, 'new_message', 'New Message', 'رسالة جديدة', 'You have a new message', 'لديك رسالة جديدة', '{\"conversationId\":\"1\",\"messageId\":\"1\"}', 1, '2026-03-17 01:22:28'),
(3, 5, 'new_message', 'New Message', 'رسالة جديدة', 'You have a new message', 'لديك رسالة جديدة', '{\"conversationId\":1,\"messageId\":\"2\"}', 0, '2026-03-17 01:24:41'),
(4, 2, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Stunning Nile View Apartment in Cairo', 'لديك طلب حجز جديد لـ Stunning Nile View Apartment in Cairo', '{\"bookingId\":\"4\",\"propertyId\":1}', 0, '2026-03-19 00:39:36'),
(5, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Cozy Studio in Zamalek — Cairo Island', 'لديك طلب حجز جديد لـ Cozy Studio in Zamalek — Cairo Island', '{\"bookingId\":\"5\",\"propertyId\":5}', 0, '2026-03-19 00:41:20'),
(6, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Cozy Studio in Zamalek — Cairo Island', 'لديك طلب حجز جديد لـ Cozy Studio in Zamalek — Cairo Island', '{\"bookingId\":\"6\",\"propertyId\":5}', 0, '2026-03-19 00:41:47'),
(7, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Cozy Studio in Zamalek — Cairo Island', 'لديك طلب حجز جديد لـ Cozy Studio in Zamalek — Cairo Island', '{\"bookingId\":\"7\",\"propertyId\":5}', 0, '2026-03-19 00:45:17'),
(8, 3, 'booking_cancelled', 'Booking Cancelled', 'تم إلغاء الحجز', 'A booking has been cancelled', 'تم إلغاء حجز', '{\"bookingId\":7}', 0, '2026-03-19 00:47:48'),
(9, 4, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Lagoon House with Private Pool — El Gouna', 'لديك طلب حجز جديد لـ Lagoon House with Private Pool — El Gouna', '{\"bookingId\":\"8\",\"propertyId\":6}', 0, '2026-03-20 12:00:31'),
(10, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Charming Historic Apartment — Art Deco Alexandria', 'لديك طلب حجز جديد لـ Charming Historic Apartment — Art Deco Alexandria', '{\"bookingId\":\"9\",\"propertyId\":3}', 0, '2026-03-21 01:15:30'),
(11, 3, 'booking_cancelled', 'Booking Cancelled', 'تم إلغاء الحجز', 'A booking has been cancelled', 'تم إلغاء حجز', '{\"bookingId\":9}', 0, '2026-03-21 01:16:03'),
(14, 10, 'booking_confirmed', 'Booking Confirmed', 'تم تأكيد الحجز', 'Your booking has been confirmed', 'تم تأكيد حجزك', '{\"bookingId\":10}', 1, '2026-03-21 13:07:11'),
(17, 10, 'booking_confirmed', 'Booking Confirmed', 'تم تأكيد الحجز', 'Your booking has been confirmed', 'تم تأكيد حجزك', '{\"bookingId\":11}', 1, '2026-03-21 13:41:08'),
(19, 5, 'new_message', 'New Message', 'رسالة جديدة', 'You have a new message', 'لديك رسالة جديدة', '{\"conversationId\":1,\"messageId\":\"3\"}', 0, '2026-03-21 17:40:42'),
(20, 5, 'new_message', 'New Message', 'رسالة جديدة', 'You received an image', 'استلمت صورة', '{\"conversationId\":1,\"messageId\":\"4\"}', 0, '2026-03-21 17:40:42'),
(21, 5, 'new_message', 'New Message', 'رسالة جديدة', 'You have a new message', 'لديك رسالة جديدة', '{\"conversationId\":1,\"messageId\":\"5\"}', 0, '2026-03-21 18:23:48'),
(22, 5, 'new_message', 'New Message', 'رسالة جديدة', 'You have a new message', 'لديك رسالة جديدة', '{\"conversationId\":1,\"messageId\":\"6\"}', 0, '2026-03-21 18:23:53'),
(24, 10, 'experience_confirmed', 'Experience Booking Confirmed', 'تم تأكيد حجز التجربة', 'Your booking for \"werwerewr\" has been confirmed', 'تم تأكيد حجزك لتجربة \"werwerewr\"', '{\"bookingId\":1}', 1, '2026-03-22 01:15:16'),
(25, 3, 'new_message', 'New Message', 'رسالة جديدة', 'You have a new message', 'لديك رسالة جديدة', '{\"conversationId\":\"2\",\"messageId\":\"7\"}', 0, '2026-03-22 13:21:58'),
(26, 4, 'payment_submitted', 'Payment Submitted', 'تم إرسال الدفع', 'Guest submitted an InstaPay transfer for booking #8. Ref: 232456575788678', 'أرسل الضيف تحويل InstaPay للحجز #8. المرجع: 232456575788678', '{\"bookingId\":8}', 0, '2026-03-22 17:31:52'),
(27, 4, 'booking_cancelled', 'Booking Cancelled', 'تم إلغاء الحجز', 'A booking has been cancelled. Refund: USD 175.00', 'تم إلغاء حجز. Refund: USD 175.00', '{\"bookingId\":8}', 0, '2026-03-22 17:32:10'),
(30, 10, 'booking_confirmed', 'Booking Confirmed', 'تم تأكيد الحجز', 'Your booking has been confirmed', 'تم تأكيد حجزك', '{\"bookingId\":13}', 1, '2026-03-23 12:57:09'),
(33, 10, 'booking_confirmed', 'Booking Confirmed', 'تم تأكيد الحجز', 'Your booking has been confirmed', 'تم تأكيد حجزك', '{\"bookingId\":14}', 1, '2026-03-23 14:25:09'),
(36, 10, 'booking_confirmed', 'Booking Confirmed', 'تم تأكيد الحجز', 'Your booking has been confirmed', 'تم تأكيد حجزك', '{\"bookingId\":16}', 1, '2026-03-23 16:25:59'),
(42, 10, 'booking_declined', 'Booking Declined', 'تم رفض الحجز', 'Your booking request has been declined', 'تم رفض طلب حجزك', '{\"bookingId\":17}', 1, '2026-03-23 21:57:54'),
(44, 10, 'booking_confirmed', 'Booking Confirmed', 'تم تأكيد الحجز', 'Your booking has been confirmed', 'تم تأكيد حجزك', '{\"bookingId\":19}', 1, '2026-03-23 23:32:31'),
(45, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Gothic Quarter Penthouse — Barcelona', 'لديك طلب حجز جديد لـ Gothic Quarter Penthouse — Barcelona', '{\"bookingId\":\"20\",\"propertyId\":226}', 0, '2026-03-23 23:55:31'),
(48, 10, 'booking_confirmed', 'Booking Confirmed', 'تم تأكيد الحجز', 'Your booking has been confirmed', 'تم تأكيد حجزك', '{\"bookingId\":21}', 1, '2026-03-24 20:51:21'),
(59, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Whitewashed Caldera Cave House ??? Oia, Santorini', 'لديك طلب حجز جديد لـ Whitewashed Caldera Cave House ??? Oia, Santorini', '{\"bookingId\":\"27\",\"propertyId\":171}', 0, '2026-03-26 00:23:12'),
(60, 3, 'new_message', 'New Message', 'رسالة جديدة', 'You have a new message', 'لديك رسالة جديدة', '{\"conversationId\":\"4\",\"messageId\":\"9\"}', 0, '2026-03-27 14:58:47'),
(61, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Designer Apartment near Cairo Festival City', 'لديك طلب حجز جديد لـ Designer Apartment near Cairo Festival City', '{\"bookingId\":\"28\",\"propertyId\":165}', 0, '2026-03-27 15:59:55'),
(62, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Designer Apartment near Cairo Festival City', 'لديك طلب حجز جديد لـ Designer Apartment near Cairo Festival City', '{\"bookingId\":\"29\",\"propertyId\":165}', 0, '2026-03-27 16:18:12'),
(63, 3, 'booking_cancelled', 'Booking Cancelled', 'تم إلغاء الحجز', 'A booking has been cancelled. Refund: USD 180.00', 'تم إلغاء حجز. Refund: USD 180.00', '{\"bookingId\":29}', 0, '2026-03-27 16:20:12'),
(64, 3, 'new_message', 'New Message', 'رسالة جديدة', 'You have a new message', 'لديك رسالة جديدة', '{\"conversationId\":\"5\",\"messageId\":\"10\"}', 0, '2026-03-27 19:21:15'),
(65, 3, 'new_review', 'New Review Received', 'تقييم جديد', 'You received a new 5-star review', 'لقد حصلت على تقييم جديد 5 نجوم', '{\"reviewId\":\"4\",\"propertyId\":\"226\"}', 0, '2026-03-27 21:22:43'),
(66, 3, 'new_review', 'New Review Received', 'تقييم جديد', 'You received a new 5-star review', 'لقد حصلت على تقييم جديد 5 نجوم', '{\"reviewId\":\"5\",\"propertyId\":\"226\"}', 0, '2026-03-27 21:33:25'),
(67, 10, 'cohost_invite', 'Co-host invitation — dfdfg', 'دعوة مضيف مشارك — dfdfg', 'taha invited you as a Co-host', 'دعاك taha كـCo-host', '{\"propertyId\":231,\"cohostRecordId\":\"1\",\"role\":\"co_host\"}', 1, '2026-03-27 23:30:13'),
(68, 10, 'cohost_invite', 'Co-host invitation — dfdfg', 'دعوة مضيف مشارك — dfdfg', 'taha invited you as a Cleaner', 'دعاك taha كـCleaner', '{\"propertyId\":231,\"cohostRecordId\":\"2\",\"role\":\"cleaner\"}', 1, '2026-03-27 23:31:16'),
(69, 2, 'new_message', 'New Message', 'رسالة جديدة', 'You have a new message', 'لديك رسالة جديدة', '{\"conversationId\":\"6\",\"messageId\":\"11\"}', 0, '2026-03-28 12:14:46'),
(70, 10, 'cohost_invite', 'Co-host invitation — dfdfg', 'دعوة مضيف مشارك — dfdfg', 'taha invited you as a Co-host', 'دعاك taha كـCo-host', '{\"propertyId\":231,\"cohostRecordId\":\"3\",\"role\":\"co_host\"}', 1, '2026-03-28 12:16:49'),
(71, 17, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for sddfsdf', 'لديك طلب حجز جديد لـ sddfsdf', '{\"bookingId\":\"30\",\"propertyId\":232}', 1, '2026-03-28 16:27:30'),
(72, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Authentic Nubian Guesthouse on the West Bank', 'لديك طلب حجز جديد لـ Authentic Nubian Guesthouse on the West Bank', '{\"bookingId\":\"31\",\"propertyId\":162}', 0, '2026-03-28 16:46:51'),
(73, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Authentic Nubian Guesthouse on the West Bank', 'لديك طلب حجز جديد لـ Authentic Nubian Guesthouse on the West Bank', '{\"bookingId\":\"32\",\"propertyId\":162}', 0, '2026-03-28 16:48:14'),
(74, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Designer Apartment near Cairo Festival City', 'لديك طلب حجز جديد لـ Designer Apartment near Cairo Festival City', '{\"bookingId\":\"33\",\"propertyId\":165}', 0, '2026-03-28 17:14:13'),
(75, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Designer Apartment near Cairo Festival City', 'لديك طلب حجز جديد لـ Designer Apartment near Cairo Festival City', '{\"bookingId\":\"34\",\"propertyId\":165}', 0, '2026-03-28 17:28:47'),
(76, 3, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Designer Apartment near Cairo Festival City', 'لديك طلب حجز جديد لـ Designer Apartment near Cairo Festival City', '{\"bookingId\":\"35\",\"propertyId\":165}', 0, '2026-03-28 17:49:52'),
(77, 3, 'payment_submitted', 'Payment Submitted', 'تم إرسال الدفع', 'Guest submitted an InstaPay transfer for booking #35. Ref: 232456575788678', 'أرسل الضيف تحويل InstaPay للحجز #35. المرجع: 232456575788678', '{\"bookingId\":35}', 0, '2026-03-28 18:00:23'),
(78, 10, 'payment_declined', 'Payment Could Not Be Verified', 'تعذّر التحقق من الدفع', 'Your InstaPay payment for booking #35 could not be verified within 48 hours. Please go to My Trips and retry.', 'تعذّر التحقق من دفعك للحجز #35 خلال 48 ساعة. يرجى الانتقال إلى رحلاتي والمحاولة مرة أخرى.', '{\"bookingId\":\"35\"}', 1, '2026-04-03 17:00:00'),
(79, 10, 'superhost_achieved', 'Congratulations! Your consultant application is approved', 'تهانينا! تم قبول طلب الاستشارات الخاص بك', 'You can now offer consultation services on Oikivo!', 'يمكنك الآن تقديم خدمات الاستشارات على Oikivo!', '{\"consultantId\":\"3\"}', 1, '2026-04-03 18:20:01'),
(80, 10, 'superhost_achieved', 'Congratulations! Your consultant application is approved', 'تهانينا! تم قبول طلب الاستشارات الخاص بك', 'You can now offer consultation services on Oikivo!', 'يمكنك الآن تقديم خدمات الاستشارات على Oikivo!', '{\"consultantId\":\"4\"}', 1, '2026-04-03 21:24:32'),
(81, 17, 'superhost_achieved', 'Congratulations! Your consultant application is approved', 'تهانينا! تم قبول طلب الاستشارات الخاص بك', 'You can now offer consultation services on Oikivo!', 'يمكنك الآن تقديم خدمات الاستشارات على Oikivo!', '{\"consultantId\":\"5\"}', 1, '2026-04-03 21:55:33'),
(82, 2, 'booking_request', 'New Booking Request', 'طلب حجز جديد', 'You have a new booking request for Sky Penthouse with Panoramic Garden City Views', 'لديك طلب حجز جديد لـ Sky Penthouse with Panoramic Garden City Views', '{\"bookingId\":\"36\",\"propertyId\":161}', 0, '2026-04-06 01:03:39'),
(83, 2, 'payment_submitted', 'Payment Submitted', 'تم إرسال الدفع', 'Guest submitted an InstaPay transfer for booking #36. Ref: zxcvxxcvbcvnbvnvmn', 'أرسل الضيف تحويل InstaPay للحجز #36. المرجع: zxcvxxcvbcvnbvnvmn', '{\"bookingId\":36}', 0, '2026-04-06 01:04:10'),
(84, 17, 'payment_confirmed', 'Payment Confirmed', 'تم تأكيد الدفع', 'Your payment for booking #36 has been confirmed. Your stay is all set! 🎉', 'تم تأكيد دفعك للحجز #36. إقامتك جاهزة! 🎉', '{\"bookingId\":36}', 1, '2026-04-06 01:05:40'),
(85, 2, 'booking_cancelled', 'Booking Cancelled', 'تم إلغاء الحجز', 'A booking has been cancelled. Refund: USD 3300.00', 'تم إلغاء حجز. Refund: USD 3300.00', '{\"bookingId\":36}', 0, '2026-04-06 01:11:12'),
(86, 15, 'instapay_refund_pending', 'InstaPay Refund Required', 'يلزم استرداد InstaPay يدوياً', 'Booking #36 was cancelled with a paid InstaPay amount of USD 3300.00. Manual refund required.', 'تم إلغاء الحجز #36 بمبلغ InstaPay مدفوع USD 3300.00. يلزم الاسترداد اليدوي.', '{\"bookingId\":36}', 0, '2026-04-06 01:11:20'),
(87, 17, 'instapay_refund_completed', 'InstaPay Refund Sent', 'تم إرسال استرداد InstaPay', 'Your InstaPay refund for booking #36 has been sent to your account.', 'تم إرسال استرداد InstaPay للحجز #36 إلى حسابك.', '{\"bookingId\":36}', 1, '2026-04-06 01:12:26'),
(88, 2, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 0, '2026-04-07 00:15:08'),
(89, 3, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 0, '2026-04-07 00:15:08'),
(90, 4, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 0, '2026-04-07 00:15:08'),
(91, 5, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 0, '2026-04-07 00:15:08'),
(92, 6, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 0, '2026-04-07 00:15:08'),
(93, 7, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 0, '2026-04-07 00:15:08'),
(94, 8, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 0, '2026-04-07 00:15:08'),
(95, 10, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 1, '2026-04-07 00:15:08'),
(96, 11, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 0, '2026-04-07 00:15:08'),
(97, 15, 'info', 'vxcvxcvvbcvxcvcxv', 'vxcvxcvvbcvxcvcxv', 'cxvcxvxcv', 'cxvcxvxcv', '{\"blast\":true,\"audience\":\"all\"}', 0, '2026-04-07 00:15:08');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payouts`
--

CREATE TABLE `payouts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `host_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EGP',
  `method` enum('instapay','bank_transfer','cash') NOT NULL DEFAULT 'instapay',
  `account_details` varchar(500) DEFAULT NULL,
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `note` varchar(1000) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `platform_settings`
--

CREATE TABLE `platform_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(500) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `platform_settings`
--

INSERT INTO `platform_settings` (`id`, `key`, `value`, `description`, `updated_at`) VALUES
(1, 'property_guest_fee_pct', '5', 'Guest service fee % charged on top of property booking subtotal', '2026-04-06 21:46:39'),
(2, 'property_host_fee_pct', '1', 'Host commission % deducted from property booking payout', '2026-04-06 22:08:58'),
(3, 'consultation_user_fee_pct', '10', 'Guest service fee % charged on top of experience booking subtotal', '2026-04-06 21:46:39'),
(4, 'consultation_consultant_fee_pct', '5', 'Host commission % deducted from experience booking payout', '2026-04-06 21:46:39');

-- --------------------------------------------------------

--
-- Table structure for table `properties`
--

CREATE TABLE `properties` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `host_id` bigint(20) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `space_type` enum('entire_place','private_room','shared_room') NOT NULL DEFAULT 'entire_place',
  `property_kind` varchar(100) NOT NULL DEFAULT 'apartment',
  `price_per_night` decimal(10,2) DEFAULT NULL,
  `weekend_price` decimal(10,2) DEFAULT NULL,
  `weekly_discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `monthly_discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `new_listing_promotion_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `last_minute_discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `booking_mode` enum('instant_book','approve_first_three') NOT NULL DEFAULT 'instant_book',
  `approved_bookings_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `cleaning_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `security_deposit` decimal(10,2) NOT NULL DEFAULT 0.00,
  `service_fee_percent` decimal(5,2) NOT NULL DEFAULT 14.00,
  `min_nights` int(11) NOT NULL DEFAULT 1,
  `max_nights` int(11) NOT NULL DEFAULT 365,
  `turnover_days` tinyint(4) NOT NULL DEFAULT 1 COMMENT 'Cleaning/preparation buffer days between bookings',
  `max_guests` int(11) NOT NULL DEFAULT 1,
  `bedrooms` int(11) NOT NULL DEFAULT 0,
  `bathrooms` decimal(3,1) NOT NULL DEFAULT 1.0,
  `beds` int(11) NOT NULL DEFAULT 1,
  `address` varchar(500) DEFAULT NULL,
  `city` varchar(150) DEFAULT NULL,
  `timezone` varchar(64) DEFAULT NULL COMMENT 'IANA timezone identifier (e.g., Africa/Cairo)',
  `state` varchar(150) DEFAULT NULL,
  `country` varchar(150) DEFAULT NULL,
  `country_code` char(2) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `check_in_after` time NOT NULL DEFAULT '15:00:00',
  `check_out_before` time NOT NULL DEFAULT '11:00:00',
  `check_in_instructions` text DEFAULT NULL COMMENT 'WiFi passwords, door codes, parking details',
  `allows_pets` tinyint(1) NOT NULL DEFAULT 0,
  `allows_smoking` tinyint(1) NOT NULL DEFAULT 0,
  `allows_parties` tinyint(1) NOT NULL DEFAULT 0,
  `allows_children` tinyint(1) NOT NULL DEFAULT 1,
  `instant_book` tinyint(1) NOT NULL DEFAULT 0,
  `cancellation_policy` enum('flexible','moderate','strict') NOT NULL DEFAULT 'flexible',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('draft','pending_review','published','archived') NOT NULL DEFAULT 'draft',
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `avg_rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `review_count` int(11) NOT NULL DEFAULT 0,
  `view_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `impression_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `archived_at` timestamp NULL DEFAULT NULL,
  `uuid` varchar(36) DEFAULT NULL,
  `geo_point` point NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `properties`
--

INSERT INTO `properties` (`id`, `host_id`, `category_id`, `title`, `description`, `space_type`, `property_kind`, `price_per_night`, `weekend_price`, `weekly_discount_percent`, `monthly_discount_percent`, `new_listing_promotion_enabled`, `last_minute_discount_percent`, `booking_mode`, `approved_bookings_count`, `currency`, `cleaning_fee`, `security_deposit`, `service_fee_percent`, `min_nights`, `max_nights`, `turnover_days`, `max_guests`, `bedrooms`, `bathrooms`, `beds`, `address`, `city`, `timezone`, `state`, `country`, `country_code`, `postal_code`, `latitude`, `longitude`, `check_in_after`, `check_out_before`, `check_in_instructions`, `allows_pets`, `allows_smoking`, `allows_parties`, `allows_children`, `instant_book`, `cancellation_policy`, `is_active`, `status`, `is_featured`, `avg_rating`, `review_count`, `view_count`, `impression_count`, `created_at`, `updated_at`, `archived_at`, `uuid`, `geo_point`) VALUES
(161, 2, 6, 'Sky Penthouse with Panoramic Garden City Views', 'Three floors of pure luxury perched atop a landmark Maadi tower. A private rooftop pool, cinema room, and fully equipped chef\'s kitchen. This is the finest private accommodation in Cairo for discerning travelers and corporate guests.', 'entire_place', 'apartment', 320.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 100.00, 0.00, 14.00, 1, 365, 1, 8, 4, 4.0, 6, 'Road 9, Maadi', 'Cairo', NULL, NULL, 'Egypt', 'EG', NULL, 29.9602000, 31.2587000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.95, 17, 13, 105, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5e93d-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000a779c7293a423f40849ecdaacff53d40),
(162, 3, 15, 'Authentic Nubian Guesthouse on the West Bank', 'Step into living history on the West Bank of Luxor. This lovingly restored Nubian guesthouse sits minutes from the Valley of the Kings. Hand-painted walls, rooftop sunsets over the Nile, and home-cooked Egyptian breakfasts every morning.', 'entire_place', 'house', 45.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 10.00, 0.00, 14.00, 1, 365, 1, 6, 3, 2.0, 4, 'Al Gezira, West Bank', 'Luxor', NULL, NULL, 'Egypt', 'EG', NULL, 25.6966000, 32.6103000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.91, 63, 6, 283, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5ef8a-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d95f764f1e4e4040c364aa6054b23940),
(163, 4, 1, 'Diver\'s Loft with Rooftop ??? Steps from Blue Hole', 'Purpose-built for divers, this modern loft is a 3-minute walk from the legendary Dahab Blue Hole. Storage rooms for gear, freshwater rinse station, high-speed WiFi, and a rooftop hammock area with mountain views. Breakfast included.', 'entire_place', 'apartment', 65.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 15.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 3, 'Blue Hole Road, Dahab', 'South Sinai', NULL, NULL, 'Egypt', 'EG', NULL, 28.5756000, 34.5150000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.88, 41, 0, 189, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5f055-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000052b81e85eb414140de9387855a933c40),
(164, 2, 13, 'Desert Ecolodge in Siwa Oasis', 'Disconnect from the world in this eco-lodge built from traditional kershef (salt rock). Solar powered, hot spring access, dune safari at dawn. The ultimate wellness escape in one of Egypt\'s most remote and mystical destinations.', 'entire_place', 'villa', 95.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 30.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 3, 'Siwa Town Center', 'Siwa', NULL, NULL, 'Egypt', 'EG', NULL, 29.2027000, 25.5185000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.97, 29, 0, 7, '2026-03-23 22:25:25', '2026-04-06 00:35:27', NULL, '94f5f1cb-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000dbf97e6abc84394032e6ae25e4333d40),
(165, 3, 8, 'Designer Apartment near Cairo Festival City', 'Chic and fully furnished 2-bedroom in 5th Settlement. 10 minutes from Cairo International Airport, walking distance to Cairo Festival City Mall. High-speed fiber internet, Netflix, and smart home controls.', 'entire_place', 'apartment', 60.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 20.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 2, '5th Settlement, Ring Road', 'New Cairo', NULL, NULL, 'Egypt', 'EG', NULL, 30.0099000, 31.4777000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.74, 52, 20, 200, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5f250-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000984c158c4a7a3f40fb3a70ce88023e40),
(166, 4, 11, 'Converted Felucca Houseboat ??? Aswan Nile', 'Sleep on the water in this beautifully converted traditional felucca permanently moored on the Nile. Watch Nubian fishermen at sunrise, sunset cocktails on deck, and close to Philae Temple and the Aswan High Dam.', 'entire_place', 'house', 75.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 20.00, 0.00, 14.00, 1, 365, 1, 2, 1, 1.0, 2, 'Corniche El Nil, Aswan', 'Aswan', NULL, NULL, 'Egypt', 'EG', NULL, 24.0889000, 32.8998000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.86, 38, 0, 189, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5f34f-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000006c787aa52c734040499d8026c2163840),
(167, 2, 1, 'Beachfront Bungalow ??? Ain Sokhna', 'A quick 1.5-hour drive from Cairo, this private beachfront bungalow on the Red Sea Coast is perfect for weekend escapes. Private beach access, covered terrace, outdoor shower, and fully stocked kitchen.', 'entire_place', 'house', 110.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 35.00, 0.00, 14.00, 1, 365, 1, 6, 2, 2.0, 3, 'Porto Sokhna Resort', 'Sokhna', NULL, NULL, 'Egypt', 'EG', NULL, 29.6155000, 32.3508000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.82, 44, 0, 2, '2026-03-23 22:25:25', '2026-03-28 16:27:06', NULL, '94f5f3c5-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000e9b7af03e72c404021b07268919d3d40),
(168, 3, 15, 'Belle ??poque Apartment in Downtown Cairo', 'A gem of Cairo\'s golden age. This lovingly maintained 1920s apartment retains original parquet floors, high stucco ceilings, and French windows overlooking a leafy boulevard. Walk to Tahrir Square, the Egyptian Museum, and Opera House.', 'entire_place', 'apartment', 42.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 12.00, 0.00, 14.00, 1, 365, 1, 3, 1, 1.0, 2, 'Talaat Harb Square, Downtown', 'Cairo', NULL, NULL, 'Egypt', 'EG', NULL, 30.0480000, 31.2361000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.68, 71, 0, 199, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5f529-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000ea95b20c713c3f403f355eba490c3e40),
(169, 4, 1, 'White Villa on the Mediterranean ??? North Coast', 'A gleaming white villa on Egypt\'s turquoise Mediterranean coast. Massive private pool, beachfront access, rooftop lounge, and a games room. Sleeps 10 comfortably. Perfect for groups, families, and milestone celebrations.', 'entire_place', 'villa', 450.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 150.00, 0.00, 14.00, 1, 365, 1, 10, 5, 4.0, 7, 'Sidi Heneish, Matruh', 'North Coast', NULL, NULL, 'Egypt', 'EG', NULL, 31.1965000, 27.8742000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.93, 22, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f5f5ab-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000c7293a92cbdf3b40fca9f1d24d323f40),
(170, 2, 3, 'Water Villa with Private Lagoon Dock ??? El Gouna', 'Float between lagoon and sea in this unique water villa. Your private dock means you can kayak or paddleboard directly from home. A golf cart is included, and El Gouna\'s vibrant restaurants and nightlife are minutes away.', 'entire_place', 'villa', 280.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 80.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.0, 4, 'Villa Zone, El Gouna', 'Red Sea', NULL, NULL, 'Egypt', 'EG', NULL, 27.4010000, 33.6843000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.96, 31, 0, 7, '2026-03-23 22:25:25', '2026-04-06 00:35:27', NULL, '94f5f69c-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000008f53742497d740402db29defa7663b40),
(171, 3, 11, 'Whitewashed Caldera Cave House ??? Oia, Santorini', 'The quintessential Santorini experience. This traditional cave house in Oia offers unobstructed caldera views and front-row seats to the world\'s most famous sunset. Plunge pool, private terrace, and champagne on arrival.', 'entire_place', 'villa', 520.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 100.00, 0.00, 14.00, 1, 365, 1, 2, 1, 1.0, 1, 'Oia Village', 'Oia', NULL, NULL, 'Greece', 'GR', NULL, 36.4625000, 25.3740000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.99, 88, 1, 101, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5f70e-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000039b4c876be5f394033333333333b4240),
(172, 4, 6, 'Full-Floor Penthouse ??? Dubai Marina Skyline View', 'An entire floor of a Marina tower, 52 floors up. 270-degree views of the Marina, Palm Jumeirah, and Arabian Gulf. Private pool, home cinema, and a chauffeur service available. The definition of Dubai luxury.', 'entire_place', 'apartment', 850.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'AED', 300.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.5, 4, 'Marina Walk, Dubai Marina', 'Dubai', NULL, NULL, 'United Arab Emirates', 'AE', NULL, 25.0806000, 55.1439000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.92, 45, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f5f800-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000007cf2b0506b924b40bf0e9c33a2143940),
(173, 2, 2, 'Jungle Rice Terrace Villa ??? Ubud, Bali', 'Immerse yourself in Bali\'s emerald heartland. Your private infinity pool seems to pour directly into the rice terraces below. Full staff, daily breakfast, and a private driver to Ubud\'s temples and art galleries.', 'entire_place', 'villa', 185.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 50.00, 0.00, 14.00, 1, 365, 1, 4, 2, 2.0, 2, 'Jalan Raya Tegallalang', 'Ubud', NULL, NULL, 'Indonesia', 'ID', NULL, -8.4095000, 115.2820000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.97, 112, 0, 101, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5f872-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000355eba490cd25c408b6ce7fba9d120c0),
(174, 3, 15, 'Haussmann Apartment ??? Marais District, Paris', 'A perfectly restored Second Empire apartment in Le Marais ??? Paris\'s most sought-after neighborhood. Exposed limestone walls, parquet floors, and a private courtyard. Walk to the Louvre, Centre Pompidou, and Picasso Museum.', 'entire_place', 'apartment', 220.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 60.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 2, 'Rue de Bretagne, Le Marais', 'Paris', NULL, NULL, 'France', 'FR', NULL, 48.8620000, 2.3592000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.89, 77, 0, 95, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5f965-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000001dc9e53fa4df024075931804566e4840),
(175, 4, 8, 'Designer Capsule Studio ??? Shinjuku, Tokyo', 'Experience Tokyo\'s ultra-efficient design philosophy in this architect-designed micro-apartment. Smart storage, a meditation nook, and walking distance to Shinjuku Station, Golden Gai, and all the ramen you can eat.', 'entire_place', 'apartment', 18500.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'JPY', 5000.00, 0.00, 14.00, 1, 365, 1, 2, 0, 1.0, 1, '3-chome, Shinjuku', 'Tokyo', NULL, NULL, 'Japan', 'JP', NULL, 35.6938000, 139.7034000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.84, 93, 0, 2, '2026-03-23 22:25:25', '2026-04-06 00:34:45', NULL, '94f5f9d4-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000003480b740827661407ffb3a70ced84140),
(176, 2, 15, 'Restored Riad with Plunge Pool ??? Medina, Marrakech', 'A 16th-century merchant\'s house restored to its original splendor. Zellij tilework, cedarwood ceilings, a central fountain courtyard, and a rooftop terrace overlooking the medina\'s minarets. Full riad, sleeps 8.', 'entire_place', 'house', 1800.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'MAD', 400.00, 0.00, 14.00, 1, 365, 1, 8, 4, 3.0, 6, 'Derb Sidi Ahmed Ou Moussa, Medina', 'Marrakech', NULL, NULL, 'Morocco', 'MA', NULL, 31.6294000, -7.9880000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.94, 58, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f5fac3-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000c1caa145b6f31fc0371ac05b20a13f40),
(177, 3, 1, 'Overwater Bungalow with Glass Floor ??? Maldives', 'Wake up to turquoise lagoon directly beneath you through the glass floor panels. Your own ladder into the Indian Ocean, a hammock over the water, and a butler on call 24/7. Snorkeling gear and kayaks included.', 'entire_place', 'villa', 1200.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 0.00, 0.00, 14.00, 1, 365, 1, 2, 1, 1.0, 1, 'North Mal?? Atoll', 'North Mal??', NULL, NULL, 'Maldives', 'MV', NULL, 4.3085000, 73.5265000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 5.00, 34, 0, 101, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5fbb4-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000004560e2db261524096438b6ce73b1140),
(178, 4, 8, 'Industrial Loft in Williamsburg, Brooklyn', 'A 19th-century factory floor transformed into a stunning open-plan loft. Exposed brick, 14-foot ceilings, and a rooftop with Manhattan skyline views. Steps from L train, vibrant restaurants, and Brooklyn\'s best coffee shops.', 'entire_place', 'apartment', 275.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 75.00, 0.00, 14.00, 1, 365, 1, 4, 1, 1.0, 1, 'North 6th Street, Williamsburg', 'New York', NULL, NULL, 'United States', 'US', NULL, 40.7141000, -73.9590000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.87, 66, 0, 2, '2026-03-23 22:25:25', '2026-04-06 00:34:45', NULL, '94f5fca4-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000004c378941607d52c06c09f9a0675b4440),
(179, 2, 15, 'Georgian Townhouse ??? Notting Hill, London', 'A four-story Georgian townhouse on one of London\'s most photogenic streets, two doors from Portobello Market. Original fireplaces, a private garden, and a wine cellar. Sleeps 8 in period-perfect comfort.', 'entire_place', 'house', 650.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'GBP', 150.00, 0.00, 14.00, 1, 365, 1, 8, 4, 3.5, 5, 'Pembridge Crescent, Notting Hill', 'London', NULL, NULL, 'United Kingdom', 'GB', NULL, 51.5127000, -0.2002000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.91, 29, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f5fd95-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000aa60545227a0c9bf61545227a0c14940),
(180, 3, 11, 'Cliffside Lemon Grove Villa ??? Positano, Amalfi', 'A romantic terraced villa clinging to the Amalfi cliffs above Positano. Private pool, lemon grove, and a boat for private coastal excursions. The view from the breakfast terrace will ruin all other breakfasts forever.', 'entire_place', 'villa', 480.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 120.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.0, 4, 'Via dei Mulini, Positano', 'Positano', NULL, NULL, 'Italy', 'IT', NULL, 40.6277000, 14.4843000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.98, 42, 0, 101, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f5fe87-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d5e76a2bf6f72c407fd93d7958504440),
(181, 4, 15, 'Machiya Townhouse ??? Gion District, Kyoto', 'A 100-year-old machiya (townhouse) in Kyoto\'s geisha district, thoughtfully updated with underfloor heating and a Japanese soaker bath. A traditional stone garden, tatami rooms, and private tea ceremony available on request.', 'entire_place', 'house', 42000.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'JPY', 8000.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 2, 'Gion, Higashiyama-ku', 'Kyoto', NULL, NULL, 'Japan', 'JP', NULL, 35.0039000, 135.7753000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.95, 51, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f5ff75-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d712f241cff860402a3a92cb7f804140),
(182, 2, 11, 'Clifftop Villa with Atlantic Views ??? Camps Bay', 'Perched above Camps Bay with 180-degree Atlantic Ocean views, this contemporary villa has an infinity pool that merges with the horizon. Table Mountain looms behind, Camps Bay beach is 5 minutes below.', 'entire_place', 'villa', 380.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 90.00, 0.00, 14.00, 1, 365, 1, 8, 4, 4.0, 5, 'The Glen, Camps Bay', 'Cape Town', NULL, NULL, 'South Africa', 'ZA', NULL, -33.9500000, 18.3765000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.93, 38, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f60061-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000aaf1d24d626032409a99999999f940c0),
(183, 3, 10, 'Ski-in Ski-out Alpine Chalet ??? Verbier', 'A classic Swiss chalet with direct piste access in the legendary Verbier ski resort. Stone fireplace, a sauna for apr??s-ski, a wine rack stocked with Swiss Fendant, and sunset views over the Mont-Blanc massif.', 'entire_place', 'house', 820.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 180.00, 0.00, 14.00, 1, 365, 1, 10, 5, 4.0, 7, 'Hameau de Verbier', 'Verbier', NULL, NULL, 'Switzerland', 'CH', NULL, 46.0977000, 7.2281000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.96, 23, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f6014c-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d3dee00b93e91c40dc68006f810c4740),
(184, 4, 6, 'Sky Garden Suite ??? Marina Bay, Singapore', 'A sky terrace apartment on the 48th floor with unobstructed views of Marina Bay Sands, the Gardens by the Bay, and the Singapore Strait. A private sky garden, lap pool, and full concierge service at your disposal.', 'entire_place', 'apartment', 780.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'SGD', 200.00, 0.00, 14.00, 1, 365, 1, 4, 2, 2.0, 2, 'Marina Boulevard', 'Singapore', NULL, NULL, 'Singapore', 'SG', NULL, 1.2784000, 103.8593000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.90, 27, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f60926-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000fb5c6dc5fef659406a4df38e5374f43f),
(185, 2, 2, 'Restored Farmhouse with Vineyard ??? Chianti, Tuscany', 'A stone farmhouse amid rolling Chianti vineyards with your own olive grove and vineyard terrace. A heated outdoor pool, wood-fired pizza oven, and a private wine cellar. Rolling hills in every direction, total silence at night.', 'entire_place', 'house', 340.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 80.00, 0.00, 14.00, 1, 365, 1, 8, 4, 3.0, 5, 'Via Chiantigiana, Greve in Chianti', 'Florence', NULL, NULL, 'Italy', 'IT', NULL, 43.5843000, 11.3178000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.97, 44, 0, 7, '2026-03-23 22:25:25', '2026-04-06 00:35:27', NULL, '94f60a40-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000006d567daeb6a22640c286a757caca4540),
(186, 3, 6, 'Luxury High-Rise Condo ??? Silom, Bangkok', 'A sleek, hotel-quality condo on the 35th floor in central Bangkok. Rooftop pool, fully equipped gym, and 24-hour concierge. BTS Sala Daeng station is literally downstairs. Perfect for business travelers and luxury seekers.', 'entire_place', 'apartment', 4500.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'THB', 1000.00, 0.00, 14.00, 1, 365, 1, 3, 1, 1.0, 1, 'Silom Road', 'Bangkok', NULL, NULL, 'Thailand', 'TH', NULL, 13.7233000, 100.5295000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.81, 60, 0, 2, '2026-03-23 22:25:25', '2026-03-28 16:27:06', NULL, '94f60b30-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d9cef753e3215940c364aa6054722b40),
(187, 4, 15, 'Azulejo Tile Apartment ??? Alfama, Lisbon', 'Perched in Alfama, Lisbon\'s oldest and most atmospheric neighborhood. This apartment features original azulejo panels, a private balcony for fado evenings, and a spiral staircase to a rooftop with views to the Tagus estuary.', 'entire_place', 'apartment', 130.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 30.00, 0.00, 14.00, 1, 365, 1, 3, 1, 1.0, 2, 'Rua dos Remedios, Alfama', 'Lisbon', NULL, NULL, 'Portugal', 'PT', NULL, 38.7120000, -9.1310000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.88, 73, 0, 95, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f60c1a-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000508d976e124322c04260e5d0225b4340),
(188, 2, 10, 'Lakeview Lodge ??? Queenstown, New Zealand', 'A modern mountain lodge overlooking Lake Wakatipu and The Remarkables mountain range. Hot tub on the deck, a kayak launch, and minutes from Queenstown\'s world-class skiing, bungee jumping, and wine trails.', 'entire_place', 'house', 320.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'AUD', 70.00, 0.00, 14.00, 1, 365, 1, 6, 3, 2.0, 4, 'Frankton Road', 'Queenstown', NULL, NULL, 'New Zealand', 'NZ', NULL, -45.0312000, 168.6626000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.94, 35, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f60e4b-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000008c4aea04341565404ed1915cfe8346c0),
(189, 3, 6, 'Contemporary Villa with Pool ??? Al Nakheel, Riyadh', 'A contemporary villa in one of Riyadh\'s most prestigious neighborhoods. Large entertaining spaces, a private pool and garden, a cinema room, and fully equipped diwaniya. Perfect for families and delegations.', 'entire_place', 'villa', 1500.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'SAR', 400.00, 0.00, 14.00, 1, 365, 1, 8, 4, 4.0, 5, 'Al Nakheel District', 'Riyadh', NULL, NULL, 'Saudi Arabia', 'SA', NULL, 24.7893000, 46.6413000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.83, 19, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f613a9-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000060764f1e1652474099bb96900fca3840),
(190, 4, 11, 'Ottoman Mansion on the Bosphorus ??? Bebek', 'A genuine 19th-century waterfront mansion in Bebek, the most prestigious address on the Bosphorus. Private boat dock, original painted ceilings, and uninterrupted views of European and Asian shores simultaneously.', 'entire_place', 'house', 8500.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'TRY', 2000.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.0, 4, 'Bebek Sahil', 'Istanbul', NULL, NULL, 'Turkey', 'TR', NULL, 41.0773000, 29.0462000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.96, 27, 0, 7, '2026-03-23 22:25:25', '2026-04-06 00:35:27', NULL, '94f6143a-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000401361c3d30b3d408bfd65f7e4894440),
(191, 2, 13, 'Luxury Desert Camp ??? Wadi Rum, Jordan', 'Sleep under a million stars in this luxury Bedouin-style camp in Wadi Rum. Private transparent geodesic dome for stargazing from bed, gourmet Jordanian dinner, and guided jeep tours of the Mars-like landscape included.', 'entire_place', 'villa', 150.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'JOD', 30.00, 0.00, 14.00, 1, 365, 1, 2, 1, 1.0, 1, 'Wadi Rum Protected Area', 'Wadi Rum', NULL, NULL, 'Jordan', 'JO', NULL, 29.5754000, 35.4231000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.98, 48, 0, 101, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f614c1-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000003780b2428b641404f1e166a4d933d40),
(192, 3, 15, 'Gothic Quarter Penthouse ??? Barcelona', 'A stunning penthouse apartment in Barcelona\'s 2,000-year-old Gothic Quarter, with a private terrace and views of the Barcelona Cathedral. Steps from Las Ramblas, the Born market, and the best tapas bars in Europe.', 'entire_place', 'apartment', 195.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 50.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 2, 'Carrer del Bisbe, Gothic', 'Barcelona', NULL, NULL, 'Spain', 'ES', NULL, 41.3831000, 2.1761000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.90, 84, 0, 95, '2026-03-23 22:25:25', '2026-04-07 00:16:38', NULL, '94f61536-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d49ae61da76801407e8cb96b09b14440),
(193, 4, 15, '17th-Century Canal House ??? Jordaan, Amsterdam', 'A five-story Golden Age canal house in Amsterdam\'s prettiest neighborhood. The trademark steep Dutch staircase, period furniture, a canal view breakfast room, and a secret garden terrace. Bikes provided for every guest.', 'entire_place', 'house', 285.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 65.00, 0.00, 14.00, 1, 365, 1, 6, 3, 2.0, 4, 'Prinsengracht, Jordaan', 'Amsterdam', NULL, NULL, 'Netherlands', 'NL', NULL, 52.3736000, 4.8811000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.92, 56, 0, 1, '2026-03-23 22:25:25', '2026-03-28 13:58:55', NULL, '94f615a9-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000bc0512143f8613408fe4f21fd22f4a40),
(194, 2, 1, 'Spice Island Beach Villa ??? Nungwi, Zanzibar', 'A whitewashed villa on the most beautiful beach in Zanzibar. Directly on the Indian Ocean, a private pool, coconut palms, a dhow sunset cruise included, and fresh catch grilled daily by your private cook.', 'entire_place', 'villa', 280.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 60.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.0, 4, 'Nungwi Beach', 'Nungwi', NULL, NULL, 'Tanzania', 'TZ', NULL, -5.7200000, 39.2975000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.97, 39, 0, 7, '2026-03-23 22:25:25', '2026-04-06 00:35:27', NULL, '94f6161e-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000ae47e17a14a64340e17a14ae47e116c0),
(195, 2, 6, 'Sky Penthouse with Panoramic Garden City Views', 'Three floors of pure luxury perched atop a landmark Maadi tower. A private rooftop pool, cinema room, and fully equipped chef\'s kitchen. This is the finest private accommodation in Cairo for discerning travelers and corporate guests.', 'entire_place', 'apartment', 320.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 100.00, 0.00, 14.00, 1, 365, 1, 8, 4, 4.0, 6, 'Road 9, Maadi', 'Cairo', NULL, NULL, 'Egypt', 'EG', NULL, 29.9602000, 31.2587000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.95, 17, 0, 105, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b43052a9-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000a779c7293a423f40849ecdaacff53d40),
(196, 3, 15, 'Authentic Nubian Guesthouse on the West Bank', 'Step into living history on the West Bank of Luxor. This lovingly restored Nubian guesthouse sits minutes from the Valley of the Kings. Hand-painted walls, rooftop sunsets over the Nile, and home-cooked Egyptian breakfasts every morning.', 'entire_place', 'house', 45.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 10.00, 0.00, 14.00, 1, 365, 1, 6, 3, 2.0, 4, 'Al Gezira, West Bank', 'Luxor', NULL, NULL, 'Egypt', 'EG', NULL, 25.6966000, 32.6103000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.91, 63, 0, 283, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b4305c41-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d95f764f1e4e4040c364aa6054b23940),
(197, 4, 1, 'Diver\'s Loft with Rooftop — Steps from Blue Hole', 'Purpose-built for divers, this modern loft is a 3-minute walk from the legendary Dahab Blue Hole. Storage rooms for gear, freshwater rinse station, high-speed WiFi, and a rooftop hammock area with mountain views. Breakfast included.', 'entire_place', 'apartment', 65.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 15.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 3, 'Blue Hole Road, Dahab', 'South Sinai', NULL, NULL, 'Egypt', 'EG', NULL, 28.5756000, 34.5150000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.88, 41, 0, 189, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b43062d0-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000052b81e85eb414140de9387855a933c40),
(198, 2, 13, 'Desert Ecolodge in Siwa Oasis', 'Disconnect from the world in this eco-lodge built from traditional kershef (salt rock). Solar powered, hot spring access, dune safari at dawn. The ultimate wellness escape in one of Egypt\'s most remote and mystical destinations.', 'entire_place', 'villa', 95.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 30.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 3, 'Siwa Town Center', 'Siwa', NULL, NULL, 'Egypt', 'EG', NULL, 29.2027000, 25.5185000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.97, 29, 0, 7, '2026-03-23 22:26:17', '2026-04-06 00:35:27', NULL, 'b43063af-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000dbf97e6abc84394032e6ae25e4333d40),
(199, 3, 8, 'Designer Apartment near Cairo Festival City', 'Chic and fully furnished 2-bedroom in 5th Settlement. 10 minutes from Cairo International Airport, walking distance to Cairo Festival City Mall. High-speed fiber internet, Netflix, and smart home controls.', 'entire_place', 'apartment', 60.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 20.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 2, '5th Settlement, Ring Road', 'New Cairo', NULL, NULL, 'Egypt', 'EG', NULL, 30.0099000, 31.4777000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.74, 52, 0, 200, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b43065c9-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000984c158c4a7a3f40fb3a70ce88023e40),
(200, 4, 11, 'Converted Felucca Houseboat — Aswan Nile', 'Sleep on the water in this beautifully converted traditional felucca permanently moored on the Nile. Watch Nubian fishermen at sunrise, sunset cocktails on deck, and close to Philae Temple and the Aswan High Dam.', 'entire_place', 'house', 75.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 20.00, 0.00, 14.00, 1, 365, 1, 2, 1, 1.0, 2, 'Corniche El Nil, Aswan', 'Aswan', NULL, NULL, 'Egypt', 'EG', NULL, 24.0889000, 32.8998000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.86, 38, 4, 187, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b4306679-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000006c787aa52c734040499d8026c2163840),
(201, 2, 1, 'Beachfront Bungalow — Ain Sokhna', 'A quick 1.5-hour drive from Cairo, this private beachfront bungalow on the Red Sea Coast is perfect for weekend escapes. Private beach access, covered terrace, outdoor shower, and fully stocked kitchen.', 'entire_place', 'house', 110.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 35.00, 0.00, 14.00, 1, 365, 1, 6, 2, 2.0, 3, 'Porto Sokhna Resort', 'Sokhna', NULL, NULL, 'Egypt', 'EG', NULL, 29.6155000, 32.3508000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.82, 44, 0, 2, '2026-03-23 22:26:17', '2026-03-28 16:27:06', NULL, 'b430670b-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000e9b7af03e72c404021b07268919d3d40),
(202, 3, 15, 'Belle Époque Apartment in Downtown Cairo', 'A gem of Cairo\'s golden age. This lovingly maintained 1920s apartment retains original parquet floors, high stucco ceilings, and French windows overlooking a leafy boulevard. Walk to Tahrir Square, the Egyptian Museum, and Opera House.', 'entire_place', 'apartment', 42.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 12.00, 0.00, 14.00, 1, 365, 1, 3, 1, 1.0, 2, 'Talaat Harb Square, Downtown', 'Cairo', NULL, NULL, 'Egypt', 'EG', NULL, 30.0480000, 31.2361000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.68, 71, 1, 199, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b4306855-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000ea95b20c713c3f403f355eba490c3e40),
(203, 4, 1, 'White Villa on the Mediterranean — North Coast', 'A gleaming white villa on Egypt\'s turquoise Mediterranean coast. Massive private pool, beachfront access, rooftop lounge, and a games room. Sleeps 10 comfortably. Perfect for groups, families, and milestone celebrations.', 'entire_place', 'villa', 450.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 150.00, 0.00, 14.00, 1, 365, 1, 10, 5, 4.0, 7, 'Sidi Heneish, Matruh', 'North Coast', NULL, NULL, 'Egypt', 'EG', NULL, 31.1965000, 27.8742000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.93, 22, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b43068cc-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000c7293a92cbdf3b40fca9f1d24d323f40),
(204, 2, 3, 'Water Villa with Private Lagoon Dock — El Gouna', 'Float between lagoon and sea in this unique water villa. Your private dock means you can kayak or paddleboard directly from home. A golf cart is included, and El Gouna\'s vibrant restaurants and nightlife are minutes away.', 'entire_place', 'villa', 280.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 80.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.0, 4, 'Villa Zone, El Gouna', 'Red Sea', NULL, NULL, 'Egypt', 'EG', NULL, 27.4010000, 33.6843000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.96, 31, 0, 7, '2026-03-23 22:26:17', '2026-04-06 00:35:27', NULL, 'b43069a8-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000008f53742497d740402db29defa7663b40),
(205, 3, 11, 'Whitewashed Caldera Cave House — Oia, Santorini', 'The quintessential Santorini experience. This traditional cave house in Oia offers unobstructed caldera views and front-row seats to the world\'s most famous sunset. Plunge pool, private terrace, and champagne on arrival.', 'entire_place', 'villa', 520.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 100.00, 0.00, 14.00, 1, 365, 1, 2, 1, 1.0, 1, 'Oia Village', 'Oia', NULL, NULL, 'Greece', 'GR', NULL, 36.4625000, 25.3740000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.99, 88, 0, 101, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b4306a32-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000039b4c876be5f394033333333333b4240),
(206, 4, 6, 'Full-Floor Penthouse — Dubai Marina Skyline View', 'An entire floor of a Marina tower, 52 floors up. 270-degree views of the Marina, Palm Jumeirah, and Arabian Gulf. Private pool, home cinema, and a chauffeur service available. The definition of Dubai luxury.', 'entire_place', 'apartment', 850.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'AED', 300.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.5, 4, 'Marina Walk, Dubai Marina', 'Dubai', NULL, NULL, 'United Arab Emirates', 'AE', NULL, 25.0806000, 55.1439000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.92, 45, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b4306b84-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000007cf2b0506b924b40bf0e9c33a2143940),
(207, 2, 2, 'Jungle Rice Terrace Villa — Ubud, Bali', 'Immerse yourself in Bali\'s emerald heartland. Your private infinity pool seems to pour directly into the rice terraces below. Full staff, daily breakfast, and a private driver to Ubud\'s temples and art galleries.', 'entire_place', 'villa', 185.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 50.00, 0.00, 14.00, 1, 365, 1, 4, 2, 2.0, 2, 'Jalan Raya Tegallalang', 'Ubud', NULL, NULL, 'Indonesia', 'ID', NULL, -8.4095000, 115.2820000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.97, 112, 0, 24, '2026-03-23 22:26:17', '2026-04-06 00:35:27', NULL, 'b4306c36-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000355eba490cd25c408b6ce7fba9d120c0),
(208, 3, 15, 'Haussmann Apartment — Marais District, Paris', 'A perfectly restored Second Empire apartment in Le Marais — Paris\'s most sought-after neighborhood. Exposed limestone walls, parquet floors, and a private courtyard. Walk to the Louvre, Centre Pompidou, and Picasso Museum.', 'entire_place', 'apartment', 220.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 60.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 2, 'Rue de Bretagne, Le Marais', 'Paris', NULL, NULL, 'France', 'FR', NULL, 48.8620000, 2.3592000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.89, 77, 1, 95, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b4306d67-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000001dc9e53fa4df024075931804566e4840),
(209, 4, 8, 'Designer Capsule Studio — Shinjuku, Tokyo', 'Experience Tokyo\'s ultra-efficient design philosophy in this architect-designed micro-apartment. Smart storage, a meditation nook, and walking distance to Shinjuku Station, Golden Gai, and all the ramen you can eat.', 'entire_place', 'apartment', 18500.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'JPY', 5000.00, 0.00, 14.00, 1, 365, 1, 2, 0, 1.0, 1, '3-chome, Shinjuku', 'Tokyo', NULL, NULL, 'Japan', 'JP', NULL, 35.6938000, 139.7034000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.84, 93, 0, 2, '2026-03-23 22:26:17', '2026-04-06 00:34:45', NULL, 'b4306de8-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000003480b740827661407ffb3a70ced84140),
(210, 2, 15, 'Restored Riad with Plunge Pool — Medina, Marrakech', 'A 16th-century merchant\'s house restored to its original splendor. Zellij tilework, cedarwood ceilings, a central fountain courtyard, and a rooftop terrace overlooking the medina\'s minarets. Full riad, sleeps 8.', 'entire_place', 'house', 1800.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'MAD', 400.00, 0.00, 14.00, 1, 365, 1, 8, 4, 3.0, 6, 'Derb Sidi Ahmed Ou Moussa, Medina', 'Marrakech', NULL, NULL, 'Morocco', 'MA', NULL, 31.6294000, -7.9880000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.94, 58, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b4306e84-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000c1caa145b6f31fc0371ac05b20a13f40),
(211, 3, 1, 'Overwater Bungalow with Glass Floor — Maldives', 'Wake up to turquoise lagoon directly beneath you through the glass floor panels. Your own ladder into the Indian Ocean, a hammock over the water, and a butler on call 24/7. Snorkeling gear and kayaks included.', 'entire_place', 'villa', 1200.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 0.00, 0.00, 14.00, 1, 365, 1, 2, 1, 1.0, 1, 'North Malé Atoll', 'North Malé', NULL, NULL, 'Maldives', 'MV', NULL, 4.3085000, 73.5265000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 5.00, 34, 0, 101, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b4306f0c-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000004560e2db261524096438b6ce73b1140),
(212, 4, 8, 'Industrial Loft in Williamsburg, Brooklyn', 'A 19th-century factory floor transformed into a stunning open-plan loft. Exposed brick, 14-foot ceilings, and a rooftop with Manhattan skyline views. Steps from L train, vibrant restaurants, and Brooklyn\'s best coffee shops.', 'entire_place', 'apartment', 275.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 75.00, 0.00, 14.00, 1, 365, 1, 4, 1, 1.0, 1, 'North 6th Street, Williamsburg', 'New York', NULL, NULL, 'United States', 'US', NULL, 40.7141000, -73.9590000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.87, 66, 0, 2, '2026-03-23 22:26:17', '2026-04-06 00:34:45', NULL, 'b4306f7f-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000004c378941607d52c06c09f9a0675b4440),
(213, 2, 15, 'Georgian Townhouse — Notting Hill, London', 'A four-story Georgian townhouse on one of London\'s most photogenic streets, two doors from Portobello Market. Original fireplaces, a private garden, and a wine cellar. Sleeps 8 in period-perfect comfort.', 'entire_place', 'house', 650.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'GBP', 150.00, 0.00, 14.00, 1, 365, 1, 8, 4, 3.5, 5, 'Pembridge Crescent, Notting Hill', 'London', NULL, NULL, 'United Kingdom', 'GB', NULL, 51.5127000, -0.2002000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.91, 29, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b4306fed-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000aa60545227a0c9bf61545227a0c14940),
(214, 3, 11, 'Cliffside Lemon Grove Villa — Positano, Amalfi', 'A romantic terraced villa clinging to the Amalfi cliffs above Positano. Private pool, lemon grove, and a boat for private coastal excursions. The view from the breakfast terrace will ruin all other breakfasts forever.', 'entire_place', 'villa', 480.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 120.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.0, 4, 'Via dei Mulini, Positano', 'Positano', NULL, NULL, 'Italy', 'IT', NULL, 40.6277000, 14.4843000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.98, 42, 0, 101, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b4307059-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d5e76a2bf6f72c407fd93d7958504440),
(215, 4, 15, 'Machiya Townhouse — Gion District, Kyoto', 'A 100-year-old machiya (townhouse) in Kyoto\'s geisha district, thoughtfully updated with underfloor heating and a Japanese soaker bath. A traditional stone garden, tatami rooms, and private tea ceremony available on request.', 'entire_place', 'house', 42000.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'JPY', 8000.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 2, 'Gion, Higashiyama-ku', 'Kyoto', NULL, NULL, 'Japan', 'JP', NULL, 35.0039000, 135.7753000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.95, 51, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b43070c5-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d712f241cff860402a3a92cb7f804140),
(216, 2, 11, 'Clifftop Villa with Atlantic Views — Camps Bay', 'Perched above Camps Bay with 180-degree Atlantic Ocean views, this contemporary villa has an infinity pool that merges with the horizon. Table Mountain looms behind, Camps Bay beach is 5 minutes below.', 'entire_place', 'villa', 380.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 90.00, 0.00, 14.00, 1, 365, 1, 8, 4, 4.0, 5, 'The Glen, Camps Bay', 'Cape Town', NULL, NULL, 'South Africa', 'ZA', NULL, -33.9500000, 18.3765000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.93, 38, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b4307130-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000aaf1d24d626032409a99999999f940c0),
(217, 3, 10, 'Ski-in Ski-out Alpine Chalet — Verbier', 'A classic Swiss chalet with direct piste access in the legendary Verbier ski resort. Stone fireplace, a sauna for après-ski, a wine rack stocked with Swiss Fendant, and sunset views over the Mont-Blanc massif.', 'entire_place', 'house', 820.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 180.00, 0.00, 14.00, 1, 365, 1, 10, 5, 4.0, 7, 'Hameau de Verbier', 'Verbier', NULL, NULL, 'Switzerland', 'CH', NULL, 46.0977000, 7.2281000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.96, 23, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b43071ac-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d3dee00b93e91c40dc68006f810c4740),
(218, 4, 6, 'Sky Garden Suite — Marina Bay, Singapore', 'A sky terrace apartment on the 48th floor with unobstructed views of Marina Bay Sands, the Gardens by the Bay, and the Singapore Strait. A private sky garden, lap pool, and full concierge service at your disposal.', 'entire_place', 'apartment', 780.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'SGD', 200.00, 0.00, 14.00, 1, 365, 1, 4, 2, 2.0, 2, 'Marina Boulevard', 'Singapore', NULL, NULL, 'Singapore', 'SG', NULL, 1.2784000, 103.8593000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.90, 27, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b430725a-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000fb5c6dc5fef659406a4df38e5374f43f),
(219, 2, 2, 'Restored Farmhouse with Vineyard — Chianti, Tuscany', 'A stone farmhouse amid rolling Chianti vineyards with your own olive grove and vineyard terrace. A heated outdoor pool, wood-fired pizza oven, and a private wine cellar. Rolling hills in every direction, total silence at night.', 'entire_place', 'house', 340.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 80.00, 0.00, 14.00, 1, 365, 1, 8, 4, 3.0, 5, 'Via Chiantigiana, Greve in Chianti', 'Florence', NULL, NULL, 'Italy', 'IT', NULL, 43.5843000, 11.3178000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.97, 44, 0, 7, '2026-03-23 22:26:17', '2026-04-06 00:35:27', NULL, 'b43072cc-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000006d567daeb6a22640c286a757caca4540),
(220, 3, 6, 'Luxury High-Rise Condo — Silom, Bangkok', 'A sleek, hotel-quality condo on the 35th floor in central Bangkok. Rooftop pool, fully equipped gym, and 24-hour concierge. BTS Sala Daeng station is literally downstairs. Perfect for business travelers and luxury seekers.', 'entire_place', 'apartment', 4500.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'THB', 1000.00, 0.00, 14.00, 1, 365, 1, 3, 1, 1.0, 1, 'Silom Road', 'Bangkok', NULL, NULL, 'Thailand', 'TH', NULL, 13.7233000, 100.5295000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.81, 60, 0, 2, '2026-03-23 22:26:17', '2026-03-28 16:27:06', NULL, 'b430733e-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d9cef753e3215940c364aa6054722b40),
(221, 4, 15, 'Azulejo Tile Apartment — Alfama, Lisbon', 'Perched in Alfama, Lisbon\'s oldest and most atmospheric neighborhood. This apartment features original azulejo panels, a private balcony for fado evenings, and a spiral staircase to a rooftop with views to the Tagus estuary.', 'entire_place', 'apartment', 130.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 30.00, 0.00, 14.00, 1, 365, 1, 3, 1, 1.0, 2, 'Rua dos Remedios, Alfama', 'Lisbon', NULL, NULL, 'Portugal', 'PT', NULL, 38.7120000, -9.1310000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 4.88, 73, 0, 95, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b43073c9-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000508d976e124322c04260e5d0225b4340),
(222, 2, 10, 'Lakeview Lodge — Queenstown, New Zealand', 'A modern mountain lodge overlooking Lake Wakatipu and The Remarkables mountain range. Hot tub on the deck, a kayak launch, and minutes from Queenstown\'s world-class skiing, bungee jumping, and wine trails.', 'entire_place', 'house', 320.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'AUD', 70.00, 0.00, 14.00, 1, 365, 1, 6, 3, 2.0, 4, 'Frankton Road', 'Queenstown', NULL, NULL, 'New Zealand', 'NZ', NULL, -45.0312000, 168.6626000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.94, 35, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b430746a-26f6-11f1-8811-84a938fc7bd1', 0x0000000001010000008c4aea04341565404ed1915cfe8346c0),
(223, 3, 6, 'Contemporary Villa with Pool — Al Nakheel, Riyadh', 'A contemporary villa in one of Riyadh\'s most prestigious neighborhoods. Large entertaining spaces, a private pool and garden, a cinema room, and fully equipped diwaniya. Perfect for families and delegations.', 'entire_place', 'villa', 1500.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'SAR', 400.00, 0.00, 14.00, 1, 365, 1, 8, 4, 4.0, 5, 'Al Nakheel District', 'Riyadh', NULL, NULL, 'Saudi Arabia', 'SA', NULL, 24.7893000, 46.6413000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.83, 19, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b430756d-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000060764f1e1652474099bb96900fca3840),
(224, 4, 11, 'Ottoman Mansion on the Bosphorus — Bebek', 'A genuine 19th-century waterfront mansion in Bebek, the most prestigious address on the Bosphorus. Private boat dock, original painted ceilings, and uninterrupted views of European and Asian shores simultaneously.', 'entire_place', 'house', 8500.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'TRY', 2000.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.0, 4, 'Bebek Sahil', 'Istanbul', NULL, NULL, 'Turkey', 'TR', NULL, 41.0773000, 29.0462000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.96, 27, 0, 3, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b43076bc-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000401361c3d30b3d408bfd65f7e4894440),
(225, 2, 13, 'Luxury Desert Camp — Wadi Rum, Jordan', 'Sleep under a million stars in this luxury Bedouin-style camp in Wadi Rum. Private transparent geodesic dome for stargazing from bed, gourmet Jordanian dinner, and guided jeep tours of the Mars-like landscape included.', 'entire_place', 'villa', 150.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'JOD', 30.00, 0.00, 14.00, 1, 365, 1, 2, 1, 1.0, 1, 'Wadi Rum Protected Area', 'Wadi Rum', NULL, NULL, 'Jordan', 'JO', NULL, 29.5754000, 35.4231000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.98, 48, 0, 101, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b43077bb-26f6-11f1-8811-84a938fc7bd1', 0x00000000010100000003780b2428b641404f1e166a4d933d40);
INSERT INTO `properties` (`id`, `host_id`, `category_id`, `title`, `description`, `space_type`, `property_kind`, `price_per_night`, `weekend_price`, `weekly_discount_percent`, `monthly_discount_percent`, `new_listing_promotion_enabled`, `last_minute_discount_percent`, `booking_mode`, `approved_bookings_count`, `currency`, `cleaning_fee`, `security_deposit`, `service_fee_percent`, `min_nights`, `max_nights`, `turnover_days`, `max_guests`, `bedrooms`, `bathrooms`, `beds`, `address`, `city`, `timezone`, `state`, `country`, `country_code`, `postal_code`, `latitude`, `longitude`, `check_in_after`, `check_out_before`, `check_in_instructions`, `allows_pets`, `allows_smoking`, `allows_parties`, `allows_children`, `instant_book`, `cancellation_policy`, `is_active`, `status`, `is_featured`, `avg_rating`, `review_count`, `view_count`, `impression_count`, `created_at`, `updated_at`, `archived_at`, `uuid`, `geo_point`) VALUES
(226, 3, 15, 'Gothic Quarter Penthouse — Barcelona', 'A stunning penthouse apartment in Barcelona\'s 2,000-year-old Gothic Quarter, with a private terrace and views of the Barcelona Cathedral. Steps from Las Ramblas, the Born market, and the best tapas bars in Europe.', 'entire_place', 'apartment', 195.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 50.00, 0.00, 14.00, 1, 365, 1, 4, 2, 1.0, 2, 'Carrer del Bisbe, Gothic', 'Barcelona', NULL, NULL, 'Spain', 'ES', NULL, 41.3831000, 2.1761000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 5.00, 1, 7, 176, '2026-03-23 22:26:17', '2026-04-07 00:16:38', NULL, 'b43078e2-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000d49ae61da76801407e8cb96b09b14440),
(227, 4, 15, '17th-Century Canal House — Jordaan, Amsterdam', 'A five-story Golden Age canal house in Amsterdam\'s prettiest neighborhood. The trademark steep Dutch staircase, period furniture, a canal view breakfast room, and a secret garden terrace. Bikes provided for every guest.', 'entire_place', 'house', 285.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'EUR', 65.00, 0.00, 14.00, 1, 365, 1, 6, 3, 2.0, 4, 'Prinsengracht, Jordaan', 'Amsterdam', NULL, NULL, 'Netherlands', 'NL', NULL, 52.3736000, 4.8811000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.92, 56, 0, 1, '2026-03-23 22:26:17', '2026-03-28 13:58:55', NULL, 'b430799a-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000bc0512143f8613408fe4f21fd22f4a40),
(228, 2, 1, 'Spice Island Beach Villa — Nungwi, Zanzibar', 'A whitewashed villa on the most beautiful beach in Zanzibar. Directly on the Indian Ocean, a private pool, coconut palms, a dhow sunset cruise included, and fresh catch grilled daily by your private cook.', 'entire_place', 'villa', 280.00, NULL, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 60.00, 0.00, 14.00, 1, 365, 1, 6, 3, 3.0, 4, 'Nungwi Beach', 'Nungwi', NULL, NULL, 'Tanzania', 'TZ', NULL, -5.7200000, 39.2975000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 4.97, 39, 0, 7, '2026-03-23 22:26:17', '2026-04-06 00:35:27', NULL, 'b4307a89-26f6-11f1-8811-84a938fc7bd1', 0x000000000101000000ae47e17a14a64340e17a14ae47e116c0),
(231, 17, 15, 'dfdfg', 'fffffffffffffffffffffffffffffffffffffffffffgdfgdfgdfg', 'private_room', 'apartment', 18700.00, 21505.00, 25.00, 30.00, 0, 0.00, 'instant_book', 0, 'USD', 0.00, 0.00, 14.00, 1, 365, 1, 2, 1, 1.0, 1, '21 ismaiel al kabane', 'Nasr city', NULL, NULL, 'Egypt', NULL, NULL, 0.0000000, 0.0000000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 0.00, 0, 20, 0, '2026-03-27 23:17:35', '2026-04-06 01:11:46', NULL, '167ab0cf-323d-4627-99a4-ed3611320e20', 0x00000000010100000000000000000000000000000000000000),
(232, 17, 15, 'sddfsdf', 'ewwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwrweeeeeee\n\nWhat makes this place unique:\nSelf check-in', 'entire_place', 'apartment', 100.00, 600.00, 0.00, 0.00, 0, 0.00, 'instant_book', 0, 'USD', 0.00, 5000.00, 14.00, 1, 365, 1, 2, 1, 1.0, 1, '21 ismaiel al kabane', 'Nasr city', NULL, NULL, 'Egypt', NULL, NULL, 0.0000000, 0.0000000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 1, 'flexible', 1, 'published', 0, 0.00, 0, 8, 1, '2026-03-28 16:15:16', '2026-04-06 01:11:44', NULL, '999776a5-b66d-4c1a-976d-742da832d538', 0x00000000010100000000000000000000000000000000000000),
(233, 10, 8, 'sdfdgdfgdfg', 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'entire_place', 'apartment', 500.00, 600.00, 25.00, 30.00, 0, 0.00, 'instant_book', 0, 'EGP', 0.00, 5000.00, 14.00, 1, 365, 1, 2, 1, 1.0, 1, '21 ismaiel al kabane', 'Nasr city', NULL, NULL, 'Egypt', NULL, NULL, 0.0000000, 0.0000000, '15:00:00', '11:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 0.00, 0, 0, 0, '2026-03-29 22:34:40', '2026-04-06 00:45:02', NULL, '5af50630-60f9-45fa-a51d-0fac01bcbf9a', 0x00000000010100000000000000000000000000000000000000),
(235, 17, 8, 'fdsfgdfhfjghjghk', 'ertretryyutiuyiyuiyuiyuiyuiyuiuytyertytruytrtyruyti\n\nWhat makes this place unique:\nPet-friendly\nGame room\nEV charger\nPrivate parking', 'private_room', 'house', 500.00, 750.00, 25.00, 20.00, 0, 0.00, 'instant_book', 0, 'EGP', 0.00, 5000.00, 14.00, 5, 365, 1, 3, 2, 2.0, 2, '21 ismaiel al kabane', 'Nasr city', NULL, NULL, 'Egypt', NULL, NULL, 0.0000000, 0.0000000, '10:00:00', '18:00:00', NULL, 0, 0, 0, 1, 0, 'flexible', 1, 'published', 0, 0.00, 0, 0, 0, '2026-04-06 00:48:24', '2026-04-06 01:11:42', NULL, 'f4690c37-a758-4b21-a992-752c0477605b', 0x00000000010100000000000000000000000000000000000000);

--
-- Triggers `properties`
--
DELIMITER $$
CREATE TRIGGER `trg_properties_geo_before_insert` BEFORE INSERT ON `properties` FOR EACH ROW SET NEW.geo_point = POINT(IFNULL(NEW.longitude, 0), IFNULL(NEW.latitude, 0))
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_properties_geo_before_update` BEFORE UPDATE ON `properties` FOR EACH ROW SET NEW.geo_point = POINT(IFNULL(NEW.longitude, 0), IFNULL(NEW.latitude, 0))
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `property_amenities`
--

CREATE TABLE `property_amenities` (
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `amenity_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_amenities`
--

INSERT INTO `property_amenities` (`property_id`, `amenity_id`) VALUES
(161, 1),
(161, 2),
(161, 3),
(161, 4),
(161, 6),
(161, 8),
(161, 9),
(161, 11),
(161, 13),
(161, 21),
(161, 22),
(161, 23),
(162, 1),
(162, 2),
(162, 4),
(162, 21),
(162, 22),
(162, 23),
(163, 1),
(163, 2),
(163, 4),
(163, 18),
(163, 19),
(163, 21),
(163, 22),
(164, 1),
(164, 2),
(164, 11),
(164, 21),
(164, 22),
(164, 23),
(165, 1),
(165, 2),
(165, 4),
(165, 6),
(165, 8),
(165, 9),
(165, 21),
(165, 22),
(166, 1),
(166, 2),
(166, 4),
(166, 9),
(166, 21),
(166, 22),
(167, 1),
(167, 2),
(167, 4),
(167, 14),
(167, 15),
(167, 18),
(167, 21),
(167, 22),
(168, 1),
(168, 2),
(168, 5),
(168, 9),
(168, 21),
(168, 22),
(169, 1),
(169, 2),
(169, 3),
(169, 4),
(169, 5),
(169, 6),
(169, 9),
(169, 11),
(169, 12),
(169, 13),
(169, 14),
(169, 15),
(169, 21),
(169, 22),
(169, 23),
(170, 1),
(170, 2),
(170, 4),
(170, 9),
(170, 11),
(170, 19),
(170, 20),
(170, 21),
(170, 22),
(171, 1),
(171, 2),
(171, 4),
(171, 11),
(171, 12),
(171, 21),
(171, 22),
(171, 23),
(172, 1),
(172, 2),
(172, 3),
(172, 4),
(172, 8),
(172, 11),
(172, 13),
(172, 21),
(172, 22),
(172, 23),
(173, 1),
(173, 2),
(173, 4),
(173, 11),
(173, 14),
(173, 18),
(173, 21),
(173, 22),
(173, 23),
(174, 1),
(174, 2),
(174, 5),
(174, 6),
(174, 9),
(174, 21),
(174, 22),
(175, 1),
(175, 2),
(175, 4),
(175, 8),
(175, 9),
(175, 21),
(175, 22),
(176, 1),
(176, 2),
(176, 4),
(176, 11),
(176, 12),
(176, 14),
(176, 21),
(176, 22),
(176, 23),
(177, 1),
(177, 12),
(177, 15),
(177, 21),
(177, 22),
(177, 23),
(178, 1),
(178, 2),
(178, 5),
(178, 6),
(178, 8),
(178, 9),
(178, 21),
(178, 22),
(179, 1),
(179, 2),
(179, 3),
(179, 5),
(179, 6),
(179, 11),
(179, 13),
(179, 21),
(179, 22),
(180, 1),
(180, 2),
(180, 4),
(180, 11),
(180, 14),
(180, 18),
(180, 21),
(180, 22),
(180, 23),
(181, 1),
(181, 2),
(181, 5),
(181, 21),
(181, 22),
(181, 23),
(182, 1),
(182, 2),
(182, 4),
(182, 11),
(182, 13),
(182, 14),
(182, 21),
(182, 22),
(182, 23),
(183, 1),
(183, 2),
(183, 5),
(183, 12),
(183, 16),
(183, 21),
(183, 22),
(183, 23),
(184, 1),
(184, 2),
(184, 3),
(184, 4),
(184, 8),
(184, 11),
(184, 13),
(184, 21),
(184, 22),
(184, 23),
(185, 1),
(185, 2),
(185, 4),
(185, 9),
(185, 11),
(185, 14),
(185, 19),
(185, 21),
(185, 22),
(186, 1),
(186, 2),
(186, 4),
(186, 8),
(186, 11),
(186, 13),
(186, 21),
(186, 22),
(186, 23),
(187, 1),
(187, 2),
(187, 5),
(187, 8),
(187, 9),
(187, 21),
(187, 22),
(188, 1),
(188, 2),
(188, 5),
(188, 12),
(188, 14),
(188, 19),
(188, 20),
(188, 21),
(188, 22),
(189, 1),
(189, 2),
(189, 3),
(189, 4),
(189, 9),
(189, 11),
(189, 13),
(189, 21),
(189, 22),
(189, 23),
(190, 1),
(190, 2),
(190, 4),
(190, 8),
(190, 9),
(190, 14),
(190, 21),
(190, 22),
(191, 1),
(191, 14),
(191, 18),
(191, 21),
(191, 22),
(191, 23),
(192, 1),
(192, 2),
(192, 4),
(192, 8),
(192, 9),
(192, 11),
(192, 21),
(192, 22),
(192, 23),
(193, 1),
(193, 2),
(193, 5),
(193, 6),
(193, 9),
(193, 19),
(193, 21),
(193, 22),
(194, 1),
(194, 2),
(194, 4),
(194, 11),
(194, 14),
(194, 15),
(194, 18),
(194, 21),
(194, 22),
(194, 23),
(197, 1),
(197, 2),
(197, 4),
(197, 18),
(197, 19),
(197, 21),
(197, 22),
(200, 1),
(200, 2),
(200, 4),
(200, 9),
(200, 21),
(200, 22),
(201, 1),
(201, 2),
(201, 4),
(201, 14),
(201, 15),
(201, 18),
(201, 21),
(201, 22),
(202, 1),
(202, 2),
(202, 5),
(202, 9),
(202, 21),
(202, 22),
(203, 1),
(203, 2),
(203, 3),
(203, 4),
(203, 5),
(203, 6),
(203, 9),
(203, 11),
(203, 12),
(203, 13),
(203, 14),
(203, 15),
(203, 21),
(203, 22),
(203, 23),
(204, 1),
(204, 2),
(204, 4),
(204, 9),
(204, 11),
(204, 19),
(204, 20),
(204, 21),
(204, 22),
(205, 1),
(205, 2),
(205, 4),
(205, 11),
(205, 12),
(205, 21),
(205, 22),
(205, 23),
(206, 1),
(206, 2),
(206, 3),
(206, 4),
(206, 8),
(206, 11),
(206, 13),
(206, 21),
(206, 22),
(206, 23),
(207, 1),
(207, 2),
(207, 4),
(207, 11),
(207, 14),
(207, 18),
(207, 21),
(207, 22),
(207, 23),
(208, 1),
(208, 2),
(208, 5),
(208, 6),
(208, 9),
(208, 21),
(208, 22),
(209, 1),
(209, 2),
(209, 4),
(209, 8),
(209, 9),
(209, 21),
(209, 22),
(210, 1),
(210, 2),
(210, 4),
(210, 11),
(210, 12),
(210, 14),
(210, 21),
(210, 22),
(210, 23),
(211, 1),
(211, 12),
(211, 15),
(211, 21),
(211, 22),
(211, 23),
(213, 1),
(213, 2),
(213, 3),
(213, 5),
(213, 6),
(213, 11),
(213, 13),
(213, 21),
(213, 22),
(214, 1),
(214, 2),
(214, 4),
(214, 11),
(214, 14),
(214, 18),
(214, 21),
(214, 22),
(214, 23),
(215, 1),
(215, 2),
(215, 5),
(215, 21),
(215, 22),
(215, 23),
(216, 1),
(216, 2),
(216, 4),
(216, 11),
(216, 13),
(216, 14),
(216, 21),
(216, 22),
(216, 23),
(217, 1),
(217, 2),
(217, 5),
(217, 12),
(217, 16),
(217, 21),
(217, 22),
(217, 23),
(218, 1),
(218, 2),
(218, 3),
(218, 4),
(218, 8),
(218, 11),
(218, 13),
(218, 21),
(218, 22),
(218, 23),
(219, 1),
(219, 2),
(219, 4),
(219, 9),
(219, 11),
(219, 14),
(219, 19),
(219, 21),
(219, 22),
(220, 1),
(220, 2),
(220, 4),
(220, 8),
(220, 11),
(220, 13),
(220, 21),
(220, 22),
(220, 23),
(221, 1),
(221, 2),
(221, 5),
(221, 8),
(221, 9),
(221, 21),
(221, 22),
(222, 1),
(222, 2),
(222, 5),
(222, 12),
(222, 14),
(222, 19),
(222, 20),
(222, 21),
(222, 22),
(223, 1),
(223, 2),
(223, 3),
(223, 4),
(223, 9),
(223, 11),
(223, 13),
(223, 21),
(223, 22),
(223, 23),
(224, 1),
(224, 2),
(224, 4),
(224, 8),
(224, 9),
(224, 14),
(224, 21),
(224, 22),
(225, 1),
(225, 14),
(225, 18),
(225, 21),
(225, 22),
(225, 23),
(226, 1),
(226, 2),
(226, 4),
(226, 8),
(226, 9),
(226, 11),
(226, 21),
(226, 22),
(226, 23),
(227, 1),
(227, 2),
(227, 5),
(227, 6),
(227, 9),
(227, 19),
(227, 21),
(227, 22),
(228, 1),
(228, 2),
(228, 4),
(228, 11),
(228, 14),
(228, 15),
(228, 18),
(228, 21),
(228, 22),
(228, 23),
(232, 13),
(233, 17),
(235, 3),
(235, 4),
(235, 6),
(235, 9),
(235, 11),
(235, 14);

-- --------------------------------------------------------

--
-- Table structure for table `property_availability`
--

CREATE TABLE `property_availability` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `is_blocked` tinyint(1) NOT NULL DEFAULT 0,
  `price_override` decimal(10,2) DEFAULT NULL,
  `source` enum('host','ical','booking') NOT NULL DEFAULT 'host',
  `ical_source_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_availability`
--

INSERT INTO `property_availability` (`id`, `property_id`, `date`, `is_blocked`, `price_override`, `source`, `ical_source_id`) VALUES
(51, 226, '2026-03-23', 1, NULL, 'host', NULL),
(53, 171, '2026-03-26', 1, NULL, 'host', NULL),
(54, 171, '2026-03-27', 1, NULL, 'host', NULL),
(55, 165, '2026-03-27', 1, NULL, 'host', NULL),
(56, 165, '2026-03-28', 1, NULL, 'host', NULL),
(57, 165, '2026-03-29', 1, NULL, 'host', NULL),
(58, 165, '2026-03-30', 1, NULL, 'host', NULL),
(59, 165, '2026-03-31', 1, NULL, 'host', NULL),
(60, 165, '2026-04-01', 1, NULL, 'host', NULL),
(61, 165, '2026-04-02', 1, NULL, 'host', NULL),
(62, 232, '2026-03-29', 1, NULL, 'host', NULL),
(63, 232, '2026-03-30', 1, NULL, 'host', NULL),
(64, 162, '2026-03-28', 1, NULL, 'host', NULL),
(65, 162, '2026-03-29', 1, NULL, 'host', NULL),
(66, 162, '2026-03-30', 1, NULL, 'host', NULL),
(67, 162, '2026-03-31', 1, NULL, 'host', NULL),
(68, 165, '2026-04-03', 1, NULL, 'host', NULL),
(69, 165, '2026-04-04', 1, NULL, 'host', NULL),
(70, 165, '2026-04-05', 1, NULL, 'host', NULL),
(71, 165, '2026-04-06', 1, NULL, 'host', NULL),
(72, 165, '2026-04-07', 1, NULL, 'host', NULL),
(73, 165, '2026-04-08', 1, NULL, 'host', NULL),
(74, 165, '2026-04-09', 1, NULL, 'host', NULL),
(75, 165, '2026-04-10', 1, NULL, 'host', NULL),
(76, 165, '2026-04-11', 1, NULL, 'host', NULL),
(77, 165, '2026-04-12', 1, NULL, 'host', NULL),
(78, 165, '2026-04-13', 1, NULL, 'host', NULL),
(79, 165, '2026-04-14', 1, NULL, 'host', NULL),
(80, 165, '2026-04-15', 1, NULL, 'host', NULL),
(81, 232, '2026-04-09', 0, 10000.00, 'host', NULL),
(82, 232, '2026-04-10', 0, 10000.00, 'host', NULL),
(83, 232, '2026-04-11', 0, 10000.00, 'host', NULL),
(84, 161, '2026-04-08', 0, NULL, 'host', NULL),
(85, 161, '2026-04-09', 0, NULL, 'host', NULL),
(86, 161, '2026-04-10', 0, NULL, 'host', NULL),
(87, 161, '2026-04-11', 0, NULL, 'host', NULL),
(88, 161, '2026-04-12', 0, NULL, 'host', NULL),
(89, 161, '2026-04-13', 0, NULL, 'host', NULL),
(90, 161, '2026-04-14', 0, NULL, 'host', NULL),
(91, 161, '2026-04-15', 0, NULL, 'host', NULL),
(92, 161, '2026-04-16', 0, NULL, 'host', NULL),
(93, 161, '2026-04-17', 0, NULL, 'host', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `property_house_rules`
--

CREATE TABLE `property_house_rules` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `rule` varchar(500) NOT NULL,
  `rule_ar` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_house_rules`
--

INSERT INTO `property_house_rules` (`id`, `property_id`, `rule`, `rule_ar`) VALUES
(8, 233, 'Government ID required at check-in', NULL),
(33, 235, 'Government ID required at check-in', NULL),
(34, 235, 'No pets', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `property_ical_sources`
--

CREATE TABLE `property_ical_sources` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `label` varchar(100) NOT NULL,
  `url` text NOT NULL,
  `sync_status` enum('idle','syncing','success','error') NOT NULL DEFAULT 'idle',
  `last_synced_at` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `property_photos`
--

CREATE TABLE `property_photos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_cover` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `property_photos`
--

INSERT INTO `property_photos` (`id`, `property_id`, `url`, `caption`, `display_order`, `is_cover`, `created_at`) VALUES
(104, 161, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(105, 161, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(106, 161, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', NULL, 3, 0, '2026-03-23 22:25:25'),
(107, 162, 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(108, 162, 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(109, 163, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(110, 163, 'https://images.unsplash.com/photo-1682686580950-960d1d513532?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(111, 164, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(112, 164, 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(113, 165, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(114, 165, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(115, 166, 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(116, 166, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(117, 167, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(118, 167, 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(119, 168, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(120, 168, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(121, 169, 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(122, 169, 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(123, 170, 'https://images.unsplash.com/photo-1469796466635-455ede028aca?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(124, 170, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(125, 171, 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(126, 171, 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(127, 171, 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200', NULL, 3, 0, '2026-03-23 22:25:25'),
(128, 172, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(129, 172, 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(130, 173, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(131, 173, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(132, 173, 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=1200', NULL, 3, 0, '2026-03-23 22:25:25'),
(133, 174, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(134, 174, 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(135, 175, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(136, 175, 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(137, 176, 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(138, 176, 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(139, 177, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(140, 177, 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(141, 178, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(142, 178, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(143, 179, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(144, 179, 'https://images.unsplash.com/photo-1444978360867-2e716fcd17a7?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(145, 180, 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(146, 180, 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(147, 181, 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(148, 181, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(149, 182, 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(150, 182, 'https://images.unsplash.com/photo-1576485375217-d6a95e34d043?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(151, 183, 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(152, 183, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(153, 184, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(154, 184, 'https://images.unsplash.com/photo-1548484352-ea579e5233a8?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(155, 185, 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(156, 185, 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(157, 186, 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(158, 186, 'https://images.unsplash.com/photo-1559628233-100c798642d5?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(159, 187, 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(160, 187, 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(161, 188, 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(162, 188, 'https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(163, 189, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(164, 189, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(165, 190, 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(166, 190, 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(167, 191, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(168, 191, 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(169, 192, 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(170, 192, 'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(171, 193, 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(172, 193, 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(173, 194, 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1200', NULL, 1, 1, '2026-03-23 22:25:25'),
(174, 194, 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200', NULL, 2, 0, '2026-03-23 22:25:25'),
(175, 161, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(176, 161, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(177, 161, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', NULL, 3, 0, '2026-03-23 22:26:18'),
(178, 162, 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(179, 162, 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(180, 197, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(181, 197, 'https://images.unsplash.com/photo-1682686580950-960d1d513532?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(182, 164, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(183, 164, 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(184, 165, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(185, 165, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(186, 200, 'https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(187, 200, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(188, 201, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(189, 201, 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(190, 202, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(191, 202, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(192, 203, 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(193, 203, 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(194, 204, 'https://images.unsplash.com/photo-1469796466635-455ede028aca?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(195, 204, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(196, 205, 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(197, 205, 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(198, 205, 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200', NULL, 3, 0, '2026-03-23 22:26:18'),
(199, 206, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(200, 206, 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(201, 207, 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(202, 207, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(203, 207, 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=1200', NULL, 3, 0, '2026-03-23 22:26:18'),
(204, 208, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(205, 208, 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(206, 209, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(207, 209, 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(208, 210, 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(209, 210, 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(210, 211, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(211, 211, 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(212, 178, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(213, 178, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(214, 213, 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(215, 213, 'https://images.unsplash.com/photo-1444978360867-2e716fcd17a7?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(216, 214, 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(217, 214, 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(218, 215, 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(219, 215, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(220, 216, 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(221, 216, 'https://images.unsplash.com/photo-1576485375217-d6a95e34d043?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(222, 217, 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(223, 217, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(224, 218, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(225, 218, 'https://images.unsplash.com/photo-1548484352-ea579e5233a8?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(226, 219, 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(227, 219, 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(228, 220, 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(229, 220, 'https://images.unsplash.com/photo-1559628233-100c798642d5?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(230, 221, 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(231, 221, 'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(232, 222, 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(233, 222, 'https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(234, 223, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(235, 223, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(236, 224, 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(237, 224, 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(238, 225, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(239, 225, 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(240, 226, 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(241, 226, 'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(242, 227, 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(243, 227, 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(244, 228, 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1200', NULL, 1, 1, '2026-03-23 22:26:18'),
(245, 228, 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1200', NULL, 2, 0, '2026-03-23 22:26:18'),
(256, 231, '/uploads/properties/231/photo-1774646292562-864684824.png', NULL, 0, 1, '2026-03-27 23:18:12'),
(257, 231, '/uploads/properties/231/photo-1774646292573-488397909.png', NULL, 1, 0, '2026-03-27 23:18:12'),
(258, 231, '/uploads/properties/231/photo-1774646292575-707854639.png', NULL, 2, 0, '2026-03-27 23:18:12'),
(259, 231, '/uploads/properties/231/photo-1774646292575-63683015.png', NULL, 3, 0, '2026-03-27 23:18:12'),
(260, 231, '/uploads/properties/231/photo-1774646292605-842309290.png', NULL, 4, 0, '2026-03-27 23:18:12'),
(261, 232, '/uploads/properties/232/photo-1774707339400-935373413.png', NULL, 0, 1, '2026-03-28 16:15:39'),
(262, 232, '/uploads/properties/232/photo-1774707339412-570840205.png', NULL, 1, 0, '2026-03-28 16:15:39'),
(263, 232, '/uploads/properties/232/photo-1774707339415-273036506.png', NULL, 2, 0, '2026-03-28 16:15:39'),
(264, 232, '/uploads/properties/232/photo-1774707339415-758453499.png', NULL, 3, 0, '2026-03-28 16:15:39'),
(265, 232, '/uploads/properties/232/photo-1774707339437-585291632.png', NULL, 4, 0, '2026-03-28 16:15:39'),
(266, 233, '/uploads/properties/233/photo-1774816506202-25134401.png', NULL, 0, 1, '2026-03-29 22:35:06'),
(267, 233, '/uploads/properties/233/photo-1774816506206-526504403.png', NULL, 1, 0, '2026-03-29 22:35:06'),
(268, 233, '/uploads/properties/233/photo-1774816506213-10833324.png', NULL, 2, 0, '2026-03-29 22:35:06'),
(269, 233, '/uploads/properties/233/photo-1774816506215-744411853.jpg', NULL, 3, 0, '2026-03-29 22:35:06'),
(270, 233, '/uploads/properties/233/photo-1774816506221-306956643.png', NULL, 4, 0, '2026-03-29 22:35:06'),
(271, 235, '/uploads/properties/235/photo-1775429822386-543557440.png', NULL, 0, 1, '2026-04-06 00:57:02'),
(272, 235, '/uploads/properties/235/photo-1775429822389-753942973.png', NULL, 1, 0, '2026-04-06 00:57:02'),
(273, 235, '/uploads/properties/235/photo-1775429822390-755102699.png', NULL, 2, 0, '2026-04-06 00:57:02'),
(274, 235, '/uploads/properties/235/photo-1775429822392-519604864.jpg', NULL, 3, 0, '2026-04-06 00:57:02'),
(275, 235, '/uploads/properties/235/photo-1775429822398-156240867.png', NULL, 4, 0, '2026-04-06 00:57:02');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `reviewer_id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `overall_rating` tinyint(3) UNSIGNED NOT NULL CHECK (`overall_rating` between 1 and 5),
  `cleanliness_rating` tinyint(3) UNSIGNED DEFAULT NULL CHECK (`cleanliness_rating` between 1 and 5),
  `accuracy_rating` tinyint(3) UNSIGNED DEFAULT NULL CHECK (`accuracy_rating` between 1 and 5),
  `communication_rating` tinyint(3) UNSIGNED DEFAULT NULL CHECK (`communication_rating` between 1 and 5),
  `location_rating` tinyint(3) UNSIGNED DEFAULT NULL CHECK (`location_rating` between 1 and 5),
  `value_rating` tinyint(3) UNSIGNED DEFAULT NULL CHECK (`value_rating` between 1 and 5),
  `checkin_rating` tinyint(3) UNSIGNED DEFAULT NULL CHECK (`checkin_rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `is_flagged` tinyint(1) NOT NULL DEFAULT 0,
  `admin_note` text DEFAULT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `host_reply` text DEFAULT NULL,
  `host_replied_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `booking_id`, `reviewer_id`, `property_id`, `overall_rating`, `cleanliness_rating`, `accuracy_rating`, `communication_rating`, `location_rating`, `value_rating`, `checkin_rating`, `comment`, `is_flagged`, `admin_note`, `photos`, `host_reply`, `host_replied_at`, `created_at`) VALUES
(5, 20, 10, 226, 5, 5, NULL, 5, 5, 5, 5, 'great', 0, NULL, NULL, NULL, NULL, '2026-03-27 21:33:25');

-- --------------------------------------------------------

--
-- Table structure for table `saved_searches`
--

CREATE TABLE `saved_searches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`filters`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `profile_uuid` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `bio` varchar(2000) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `is_host` tinyint(1) NOT NULL DEFAULT 0,
  `is_superhost` tinyint(1) NOT NULL DEFAULT 0,
  `is_consultant` tinyint(1) NOT NULL DEFAULT 0,
  `is_email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `is_phone_verified` tinyint(1) NOT NULL DEFAULT 0,
  `is_id_verified` tinyint(1) NOT NULL DEFAULT 0,
  `id_document_url` varchar(500) DEFAULT NULL COMMENT 'Path to uploaded government ID document',
  `id_verification_status` enum('none','pending','approved','rejected') NOT NULL DEFAULT 'none' COMMENT 'Current state of government ID verification',
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `preferred_language` enum('en','ar') NOT NULL DEFAULT 'en',
  `google_id` varchar(255) DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `totp_secret` varchar(255) DEFAULT NULL COMMENT '2FA TOTP secret (null when 2FA not set up)',
  `is_totp_enabled` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether 2FA is active for this account',
  `last_login_at` datetime(6) DEFAULT NULL,
  `last_booking_at` datetime(6) DEFAULT NULL,
  `last_profile_edit_at` datetime(6) DEFAULT NULL,
  `notification_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_preferences`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `profile_uuid`, `email`, `password_hash`, `first_name`, `last_name`, `avatar_url`, `phone`, `bio`, `date_of_birth`, `is_host`, `is_superhost`, `is_consultant`, `is_email_verified`, `is_phone_verified`, `is_id_verified`, `id_document_url`, `id_verification_status`, `is_admin`, `is_active`, `preferred_language`, `google_id`, `refresh_token`, `created_at`, `updated_at`, `totp_secret`, `is_totp_enabled`, `last_login_at`, `last_booking_at`, `last_profile_edit_at`, `notification_preferences`) VALUES
(2, 'c2f153d2-26ed-11f1-8811-84a938fc7bd1', 'ahmed.host@example.com', '$2b$10$ZDtx2LN7XL3OsjIJE8ato.qk8fBi5TJhOGtgoDPTQU45zKqXMiBd.', 'Ahmed', 'Hassan', NULL, NULL, 'Passionate host based in Cairo. Love showing guests the best of Egypt!', NULL, 1, 0, 0, 1, 0, 0, NULL, 'none', 0, 1, 'ar', NULL, '$2b$10$D2vf3mg40qEImUx1CLQsFuE6Q7gz6LlGuR6d1joP6xAyJyD/G3HMa', '2026-03-16 23:46:37', '2026-03-23 21:22:17', NULL, 0, NULL, NULL, NULL, NULL),
(3, 'c2f17149-26ed-11f1-8811-84a938fc7bd1', 'sara.host@example.com', '$2b$10$ZDtx2LN7XL3OsjIJE8ato.qk8fBi5TJhOGtgoDPTQU45zKqXMiBd.', 'Sara', 'Mohamed', NULL, NULL, 'Superhost with 5 years of experience. I love meeting travelers!', NULL, 1, 0, 0, 1, 0, 0, NULL, 'none', 0, 1, 'en', NULL, NULL, '2026-03-16 23:46:37', '2026-03-23 21:22:17', NULL, 0, NULL, NULL, NULL, NULL),
(4, 'c2f1725e-26ed-11f1-8811-84a938fc7bd1', 'omar.host@example.com', '$2b$10$ZDtx2LN7XL3OsjIJE8ato.qk8fBi5TJhOGtgoDPTQU45zKqXMiBd.', 'Omar', 'Khalil', NULL, NULL, 'Professional property manager in Hurghada and Sharm El Sheikh.', NULL, 1, 0, 0, 1, 0, 0, NULL, 'none', 0, 1, 'ar', NULL, NULL, '2026-03-16 23:46:37', '2026-03-23 21:22:17', NULL, 0, NULL, NULL, NULL, NULL),
(5, 'c2f172c5-26ed-11f1-8811-84a938fc7bd1', 'guest1@example.com', '$2b$10$ZDtx2LN7XL3OsjIJE8ato.qk8fBi5TJhOGtgoDPTQU45zKqXMiBd.', 'Layla', 'Ibrahim', NULL, NULL, 'Love exploring new places!', NULL, 0, 0, 0, 1, 0, 0, NULL, 'none', 0, 1, 'ar', NULL, '$2b$10$sXrVtm5rCaJ0epXA3xZp3.rUBZOvjq39Q2XYexOh7PzqxZvYT2b3a', '2026-03-16 23:46:37', '2026-03-23 21:22:17', NULL, 0, NULL, NULL, NULL, NULL),
(6, 'c2f17abb-26ed-11f1-8811-84a938fc7bd1', 'guest2@example.com', '$2b$10$ZDtx2LN7XL3OsjIJE8ato.qk8fBi5TJhOGtgoDPTQU45zKqXMiBd.', 'James', 'Wilson', NULL, NULL, 'Digital nomad always looking for cozy workspaces.', NULL, 0, 0, 0, 1, 0, 0, NULL, 'none', 0, 1, 'en', NULL, NULL, '2026-03-16 23:46:37', '2026-03-23 21:22:17', NULL, 0, NULL, NULL, NULL, NULL),
(7, 'c2f17bea-26ed-11f1-8811-84a938fc7bd1', 'test@test.com', '$2b$12$W7Skfw1pI.HmTCiRAPCjkuYw1kY8FMS3CeU0q7/PO1EC3YVDO5alq', 'Test', 'User', NULL, NULL, NULL, NULL, 0, 0, 0, 1, 0, 0, NULL, 'none', 0, 1, 'en', NULL, '$2b$10$7hRD3T32FNHYjas2zijTfePO0NtnXm5Gn87cEYbJFnija.Www/AqS', '2026-03-17 01:16:17', '2026-03-23 21:22:17', NULL, 0, NULL, NULL, NULL, NULL),
(8, 'c2f17c50-26ed-11f1-8811-84a938fc7bd1', 'new20892@test.com', '$2b$12$b.65UQmEBB8E8HAl5Ve.5OuCIXT9MiBi9lcJdSWGhjpLKYavq0bV2', 'New', 'User', NULL, NULL, NULL, NULL, 0, 0, 0, 1, 0, 0, NULL, 'none', 0, 1, 'en', NULL, '$2b$10$D.7jHC3Nke.W7YrqE.1sm.w0ns3z4N83Sr.TlmGmBnu40/uP5lVNi', '2026-03-17 01:23:54', '2026-03-23 21:22:17', NULL, 0, NULL, NULL, NULL, NULL),
(10, 'c2f17cb5-26ed-11f1-8811-84a938fc7bd1', 'tahamoataz@gmail.com', '$2b$12$5nnbEX5UkSLFZiouo16JrOtbrLhBI9G0uVRYOnCPtAvvmuf/ccHre', 'taha', 'moataz', '/uploads/avatars/avatar-1774381377258-749934226.png', NULL, NULL, NULL, 1, 0, 0, 1, 0, 0, NULL, 'none', 0, 1, 'en', NULL, '$2b$10$W3vAr533b0LercWMEs4KMuz/BsV1P66SNbFjHPFzfnIQnn9N2Aa1O', '2026-03-20 11:39:30', '2026-04-07 00:16:38', NULL, 0, '2026-04-06 22:16:38.082000', NULL, NULL, NULL),
(11, 'c2f17d03-26ed-11f1-8811-84a938fc7bd1', 'tahamoataz1@gmail.com', '$2b$12$NzUhyCNqL0luqRuM.q6awu/n1ZAm9xZDa3m1X1Vf/sHfA36ccNUny', 'taha1', 'moataz', '/uploads/avatars/avatar-1774006008124-202380198.png', '', '', NULL, 0, 0, 0, 0, 0, 0, NULL, 'none', 0, 1, 'en', NULL, '$2b$10$HzpBPTkJDLWj5Tc31mojWeAlBWp24PW52vZi.CVlPV6BR9gf4sKlK', '2026-03-20 13:25:37', '2026-03-23 21:22:17', NULL, 0, NULL, NULL, NULL, NULL),
(15, 'c2f17e01-26ed-11f1-8811-84a938fc7bd1', 'admin@sakan.app', '$2b$10$qhup6zWen75uuBiJICCb4.RUKGGU8pE91LjfZI/apirVgF.5I0Lm6', 'Admin', 'Sakan', NULL, NULL, 'Platform administrator', NULL, 1, 0, 0, 1, 0, 0, NULL, 'none', 1, 1, 'en', NULL, '$2b$10$NBqWLnjWwsQ4H2.1BPGjneNwrHJm20baYV1PFCMy0gtP.JHJCZ0ya', '2026-03-23 11:21:24', '2026-04-07 00:06:04', NULL, 0, '2026-04-06 22:06:04.572000', NULL, NULL, NULL),
(17, '233c20ed-ed51-458a-a9b9-24ac1b11fff8', 'tahamoataz5@gmail.com', NULL, 'taha', 'moataz', 'https://lh3.googleusercontent.com/a/ACg8ocIhokSZ7I-yDtXC4sLNCE8-xCGOriQx5JjDqruvwAn73AvoaWOg=s96-c', '01153450920', '', NULL, 1, 0, 1, 1, 1, 1, '/uploads/id-documents/id-1774635979255-132034350.png', 'approved', 0, 0, 'en', '111444434132856504879', '$2b$10$7ytc8sA1lKf70ppQseKNCek.Sw9FzyWcKecTT9.8JGZgn1NLbu6M.', '2026-03-27 15:00:58', '2026-04-07 00:20:59', NULL, 0, NULL, '2026-04-05 23:03:39.971000', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_active_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_sessions`
--

INSERT INTO `user_sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `last_active_at`) VALUES
(1, 10, '::1', NULL, '2026-05-05 13:34:04', '2026-04-05 16:34:04', '2026-04-05 16:34:04'),
(2, 15, '::1', NULL, '2026-05-05 19:43:54', '2026-04-05 22:43:54', '2026-04-05 22:43:54'),
(3, 15, '::1', NULL, '2026-05-06 17:54:44', '2026-04-06 20:54:44', '2026-04-06 20:54:44'),
(4, 15, '::1', NULL, '2026-05-06 19:06:04', '2026-04-06 22:06:04', '2026-04-06 22:06:04'),
(5, 10, '::1', NULL, '2026-05-06 19:16:38', '2026-04-06 22:16:38', '2026-04-06 22:16:38');

-- --------------------------------------------------------

--
-- Table structure for table `verification_tokens`
--

CREATE TABLE `verification_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('email','phone') NOT NULL DEFAULT 'email',
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `verification_tokens`
--

INSERT INTO `verification_tokens` (`id`, `user_id`, `type`, `token`, `expires_at`, `used_at`, `created_at`) VALUES
(8, 17, 'phone', '327837', '2026-03-27 13:40:59', '2026-03-27 13:31:20', '2026-03-27 15:30:59');

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL DEFAULT 'Wishlist',
  `visibility` enum('private','public') NOT NULL DEFAULT 'private',
  `share_token` varchar(36) DEFAULT NULL,
  `cover_photo` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `wishlists`
--

INSERT INTO `wishlists` (`id`, `user_id`, `name`, `visibility`, `share_token`, `cover_photo`, `created_at`) VALUES
(1, 5, 'Egypt Favorites', 'private', '4d3d5b2d-304e-11f1-b636-84a938fc7bd1', NULL, '2026-03-17 01:21:28');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist_items`
--

CREATE TABLE `wishlist_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `wishlist_id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `added_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_activity_admin_id` (`admin_id`),
  ADD KEY `idx_admin_activity_created` (`created_at`);

--
-- Indexes for table `amenities`
--
ALTER TABLE `amenities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_actor_date` (`actor_id`,`created_at`),
  ADD KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_event_date` (`event_type`,`created_at`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_bookings_booking_uuid` (`booking_uuid`),
  ADD KEY `idx_bookings_guest` (`guest_id`),
  ADD KEY `idx_bookings_host` (`host_id`),
  ADD KEY `idx_bookings_property` (`property_id`),
  ADD KEY `idx_bookings_status` (`status`),
  ADD KEY `idx_bookings_dates` (`check_in`,`check_out`),
  ADD KEY `idx_bookings_created_at` (`created_at`),
  ADD KEY `idx_bookings_idempotency` (`guest_id`,`property_id`,`check_in`,`check_out`,`created_at`),
  ADD KEY `idx_bookings_payment` (`payment_status`,`payment_method`),
  ADD KEY `idx_bookings_deposit_release` (`deposit_status`,`deposit_claim_deadline`),
  ADD KEY `idx_bookings_host_status` (`host_id`,`status`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cohosts`
--
ALTER TABLE `cohosts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_cohost` (`property_id`,`cohost_id`),
  ADD KEY `host_id` (`host_id`),
  ADD KEY `idx_cohosts_cohost_status` (`cohost_id`,`status`);

--
-- Indexes for table `consultants`
--
ALTER TABLE `consultants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `uq_consultants_user` (`user_id`),
  ADD KEY `idx_consultants_status` (`status`),
  ADD KEY `idx_consultants_rating` (`avg_rating`,`review_count`),
  ADD KEY `idx_consultants_featured` (`is_featured`,`status`);

--
-- Indexes for table `consultant_availability`
--
ALTER TABLE `consultant_availability`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_consultant_day_start` (`consultant_id`,`day_of_week`,`start_time`),
  ADD KEY `idx_ca_consultant_day` (`consultant_id`,`day_of_week`);

--
-- Indexes for table `consultant_documents`
--
ALTER TABLE `consultant_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_consultant_docs_consultant` (`consultant_id`);

--
-- Indexes for table `consultant_earnings`
--
ALTER TABLE `consultant_earnings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ce_booking` (`booking_id`),
  ADD KEY `idx_ce_consultant_status` (`consultant_id`,`status`),
  ADD KEY `idx_ce_status` (`status`),
  ADD KEY `idx_earnings_payout_request` (`payout_request_id`);

--
-- Indexes for table `consultant_payout_requests`
--
ALTER TABLE `consultant_payout_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cpr_consultant_status` (`consultant_id`,`status`);

--
-- Indexes for table `consultant_vacation_blocks`
--
ALTER TABLE `consultant_vacation_blocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vacation_consultant` (`consultant_id`);

--
-- Indexes for table `consultation_bookings`
--
ALTER TABLE `consultation_bookings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD KEY `idx_cb_consultant_date` (`consultant_id`,`scheduled_at`),
  ADD KEY `idx_cb_client` (`client_id`,`status`),
  ADD KEY `idx_cb_status` (`status`),
  ADD KEY `idx_cb_consultant_status_date` (`consultant_id`,`status`,`scheduled_at`),
  ADD KEY `idx_cb_consultant_scheduled` (`consultant_id`,`scheduled_at`,`status`);

--
-- Indexes for table `consultation_reviews`
--
ALTER TABLE `consultation_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cr_booking` (`booking_id`),
  ADD KEY `fk_cr_reviewer` (`reviewer_id`),
  ADD KEY `idx_cr_consultant` (`consultant_id`,`overall_rating`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `idx_conversations_host` (`host_id`),
  ADD KEY `idx_conversations_guest` (`guest_id`);

--
-- Indexes for table `disputes`
--
ALTER TABLE `disputes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_disputes_booking` (`booking_id`),
  ADD KEY `idx_disputes_raised_by` (`raised_by_id`),
  ADD KEY `idx_disputes_status` (`status`);

--
-- Indexes for table `earnings`
--
ALTER TABLE `earnings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_earnings_booking` (`booking_id`),
  ADD KEY `idx_earnings_host` (`host_id`),
  ADD KEY `idx_earnings_status` (`status`),
  ADD KEY `idx_earnings_host_status` (`host_id`,`status`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `experiences`
--
ALTER TABLE `experiences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD KEY `idx_exp_host` (`host_id`),
  ADD KEY `idx_exp_status` (`status`),
  ADD KEY `idx_exp_city` (`city`),
  ADD KEY `idx_exp_category` (`category_id`),
  ADD KEY `idx_exp_status_city` (`status`,`city`);

--
-- Indexes for table `experience_bookings`
--
ALTER TABLE `experience_bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_expb_experience` (`experience_id`),
  ADD KEY `idx_expb_guest` (`guest_id`),
  ADD KEY `idx_expb_host` (`host_id`),
  ADD KEY `idx_expb_date` (`booking_date`),
  ADD KEY `idx_expb_status` (`status`);

--
-- Indexes for table `experience_categories`
--
ALTER TABLE `experience_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `experience_date_overrides`
--
ALTER TABLE `experience_date_overrides`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_expdo` (`experience_id`,`override_date`,`override_time`);

--
-- Indexes for table `experience_itinerary`
--
ALTER TABLE `experience_itinerary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_exp_step` (`experience_id`,`step_number`),
  ADD KEY `idx_exp_itinerary` (`experience_id`);

--
-- Indexes for table `experience_photos`
--
ALTER TABLE `experience_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_exp_photo` (`experience_id`);

--
-- Indexes for table `experience_reviews`
--
ALTER TABLE `experience_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_id` (`booking_id`),
  ADD KEY `idx_expr_experience` (`experience_id`),
  ADD KEY `idx_expr_reviewer` (`reviewer_id`);

--
-- Indexes for table `experience_schedule`
--
ALTER TABLE `experience_schedule`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_exps_slot` (`experience_id`,`day_of_week`,`start_time`),
  ADD KEY `idx_exps_exp` (`experience_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_messages_conversation` (`conversation_id`),
  ADD KEY `idx_messages_sender` (`sender_id`),
  ADD KEY `idx_messages_conversation_time` (`conversation_id`,`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_read` (`user_id`,`is_read`),
  ADD KEY `idx_notifications_user_time` (`user_id`,`created_at`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `payouts`
--
ALTER TABLE `payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payouts_host` (`host_id`),
  ADD KEY `idx_payouts_status` (`status`);

--
-- Indexes for table `platform_settings`
--
ALTER TABLE `platform_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UQ_platform_settings_key` (`key`);

--
-- Indexes for table `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UQ_properties_uuid` (`uuid`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_properties_host` (`host_id`),
  ADD KEY `idx_properties_status` (`status`),
  ADD KEY `idx_properties_location` (`latitude`,`longitude`),
  ADD KEY `idx_properties_price` (`price_per_night`),
  ADD KEY `idx_properties_city` (`city`),
  ADD KEY `idx_properties_created_at` (`created_at`),
  ADD SPATIAL KEY `idx_properties_geo_point` (`geo_point`),
  ADD KEY `idx_properties_booking_mode` (`booking_mode`),
  ADD KEY `idx_properties_active_status_city` (`is_active`,`status`,`city`),
  ADD KEY `idx_properties_country_city` (`country_code`,`city`,`is_active`);

--
-- Indexes for table `property_amenities`
--
ALTER TABLE `property_amenities`
  ADD PRIMARY KEY (`property_id`,`amenity_id`),
  ADD KEY `amenity_id` (`amenity_id`);

--
-- Indexes for table `property_availability`
--
ALTER TABLE `property_availability`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_availability` (`property_id`,`date`),
  ADD KEY `fk_av_ical_source` (`ical_source_id`);

--
-- Indexes for table `property_house_rules`
--
ALTER TABLE `property_house_rules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`);

--
-- Indexes for table `property_ical_sources`
--
ALTER TABLE `property_ical_sources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ical_property` (`property_id`);

--
-- Indexes for table `property_photos`
--
ALTER TABLE `property_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_photos_property` (`property_id`),
  ADD KEY `idx_property_photos_cover` (`property_id`,`is_cover`,`display_order`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `booking_id` (`booking_id`),
  ADD KEY `idx_reviews_property` (`property_id`),
  ADD KEY `idx_reviews_reviewer` (`reviewer_id`),
  ADD KEY `idx_reviews_property_date` (`property_id`,`created_at`);

--
-- Indexes for table `saved_searches`
--
ALTER TABLE `saved_searches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_saved_searches_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `idx_users_profile_uuid` (`profile_uuid`),
  ADD KEY `idx_users_google` (`google_id`),
  ADD KEY `idx_users_is_consultant` (`is_consultant`);

--
-- Indexes for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_sessions_user` (`user_id`),
  ADD KEY `idx_user_sessions_expires` (`expires_at`),
  ADD KEY `idx_user_sessions_user_expires` (`user_id`,`expires_at`);

--
-- Indexes for table `verification_tokens`
--
ALTER TABLE `verification_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_verification_tokens_user_type` (`user_id`,`type`),
  ADD KEY `idx_verification_tokens_token` (`token`),
  ADD KEY `idx_verification_tokens_expires` (`expires_at`);

--
-- Indexes for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uidx_wishlists_share_token` (`share_token`),
  ADD KEY `idx_wishlists_user` (`user_id`);

--
-- Indexes for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_wishlist_item` (`wishlist_id`,`property_id`),
  ADD KEY `idx_wishlist_items_property` (`property_id`,`wishlist_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `amenities`
--
ALTER TABLE `amenities`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `cohosts`
--
ALTER TABLE `cohosts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `consultants`
--
ALTER TABLE `consultants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `consultant_availability`
--
ALTER TABLE `consultant_availability`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `consultant_documents`
--
ALTER TABLE `consultant_documents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `consultant_earnings`
--
ALTER TABLE `consultant_earnings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultant_payout_requests`
--
ALTER TABLE `consultant_payout_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultant_vacation_blocks`
--
ALTER TABLE `consultant_vacation_blocks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultation_bookings`
--
ALTER TABLE `consultation_bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `consultation_reviews`
--
ALTER TABLE `consultation_reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `disputes`
--
ALTER TABLE `disputes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `earnings`
--
ALTER TABLE `earnings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `experiences`
--
ALTER TABLE `experiences`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `experience_bookings`
--
ALTER TABLE `experience_bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `experience_categories`
--
ALTER TABLE `experience_categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `experience_date_overrides`
--
ALTER TABLE `experience_date_overrides`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `experience_itinerary`
--
ALTER TABLE `experience_itinerary`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `experience_photos`
--
ALTER TABLE `experience_photos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `experience_reviews`
--
ALTER TABLE `experience_reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `experience_schedule`
--
ALTER TABLE `experience_schedule`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=98;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `payouts`
--
ALTER TABLE `payouts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `platform_settings`
--
ALTER TABLE `platform_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=236;

--
-- AUTO_INCREMENT for table `property_availability`
--
ALTER TABLE `property_availability`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `property_house_rules`
--
ALTER TABLE `property_house_rules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `property_ical_sources`
--
ALTER TABLE `property_ical_sources`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `property_photos`
--
ALTER TABLE `property_photos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=276;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `saved_searches`
--
ALTER TABLE `saved_searches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `verification_tokens`
--
ALTER TABLE `verification_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  ADD CONSTRAINT `fk_activity_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`guest_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `cohosts`
--
ALTER TABLE `cohosts`
  ADD CONSTRAINT `cohosts_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cohosts_ibfk_2` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cohosts_ibfk_3` FOREIGN KEY (`cohost_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consultants`
--
ALTER TABLE `consultants`
  ADD CONSTRAINT `fk_consultants_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consultant_availability`
--
ALTER TABLE `consultant_availability`
  ADD CONSTRAINT `fk_ca_consultant` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consultant_documents`
--
ALTER TABLE `consultant_documents`
  ADD CONSTRAINT `fk_consultant_docs_consultant` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consultant_earnings`
--
ALTER TABLE `consultant_earnings`
  ADD CONSTRAINT `fk_ce_booking` FOREIGN KEY (`booking_id`) REFERENCES `consultation_bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ce_consultant` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consultant_payout_requests`
--
ALTER TABLE `consultant_payout_requests`
  ADD CONSTRAINT `fk_cpr_consultant` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consultant_vacation_blocks`
--
ALTER TABLE `consultant_vacation_blocks`
  ADD CONSTRAINT `fk_vacation_block_consultant` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consultation_bookings`
--
ALTER TABLE `consultation_bookings`
  ADD CONSTRAINT `fk_cb_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cb_consultant` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `consultation_reviews`
--
ALTER TABLE `consultation_reviews`
  ADD CONSTRAINT `fk_cr_booking` FOREIGN KEY (`booking_id`) REFERENCES `consultation_bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cr_consultant` FOREIGN KEY (`consultant_id`) REFERENCES `consultants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cr_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_4` FOREIGN KEY (`guest_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `disputes`
--
ALTER TABLE `disputes`
  ADD CONSTRAINT `fk_disputes_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_disputes_raised_by` FOREIGN KEY (`raised_by_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `earnings`
--
ALTER TABLE `earnings`
  ADD CONSTRAINT `earnings_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `earnings_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `experiences`
--
ALTER TABLE `experiences`
  ADD CONSTRAINT `experiences_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `experiences_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `experience_categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `experience_bookings`
--
ALTER TABLE `experience_bookings`
  ADD CONSTRAINT `experience_bookings_ibfk_1` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `experience_bookings_ibfk_2` FOREIGN KEY (`guest_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `experience_bookings_ibfk_3` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `experience_date_overrides`
--
ALTER TABLE `experience_date_overrides`
  ADD CONSTRAINT `experience_date_overrides_ibfk_1` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `experience_itinerary`
--
ALTER TABLE `experience_itinerary`
  ADD CONSTRAINT `experience_itinerary_ibfk_1` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `experience_photos`
--
ALTER TABLE `experience_photos`
  ADD CONSTRAINT `experience_photos_ibfk_1` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `experience_reviews`
--
ALTER TABLE `experience_reviews`
  ADD CONSTRAINT `experience_reviews_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `experience_bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `experience_reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `experience_reviews_ibfk_3` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `experience_schedule`
--
ALTER TABLE `experience_schedule`
  ADD CONSTRAINT `experience_schedule_ibfk_1` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payouts`
--
ALTER TABLE `payouts`
  ADD CONSTRAINT `payouts_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `properties_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `property_amenities`
--
ALTER TABLE `property_amenities`
  ADD CONSTRAINT `property_amenities_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `property_amenities_ibfk_2` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_availability`
--
ALTER TABLE `property_availability`
  ADD CONSTRAINT `fk_av_ical_source` FOREIGN KEY (`ical_source_id`) REFERENCES `property_ical_sources` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `property_availability_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_house_rules`
--
ALTER TABLE `property_house_rules`
  ADD CONSTRAINT `property_house_rules_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_ical_sources`
--
ALTER TABLE `property_ical_sources`
  ADD CONSTRAINT `fk_ical_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `property_photos`
--
ALTER TABLE `property_photos`
  ADD CONSTRAINT `property_photos_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `saved_searches`
--
ALTER TABLE `saved_searches`
  ADD CONSTRAINT `fk_saved_searches_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `verification_tokens`
--
ALTER TABLE `verification_tokens`
  ADD CONSTRAINT `fk_vt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  ADD CONSTRAINT `wishlist_items_ibfk_1` FOREIGN KEY (`wishlist_id`) REFERENCES `wishlists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_items_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
