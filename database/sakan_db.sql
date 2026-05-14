-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 10, 2026 at 09:32 AM
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
(4, 15, 'POST /notifications/blast', 'notifications', NULL, NULL, '::1', '2026-04-06 22:15:08'),
(5, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest1775835459@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"18\"}', '::1', '2026-04-10 15:37:55'),
(6, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest1775835516@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"19\"}', '::1', '2026-04-10 15:38:36'),
(7, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.full.1775836124@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"21\"}', '::1', '2026-04-10 15:48:44'),
(8, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.full.1775836124@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"21\"}', '::1', '2026-04-10 15:48:44'),
(9, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.recheck.1775836149@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"22\"}', '::1', '2026-04-10 15:49:09'),
(10, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.recheck2.1775836352@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"23\"}', '::1', '2026-04-10 15:52:32'),
(11, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.full.1775836676@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"24\"}', '::1', '2026-04-10 15:57:57'),
(12, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.full.1775836676@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"24\"}', '::1', '2026-04-10 15:57:57'),
(13, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.full.1775836775@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"25\"}', '::1', '2026-04-10 15:59:35'),
(14, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.full.1775836775@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"25\"}', '::1', '2026-04-10 15:59:35'),
(15, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.full.1775836820@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"26\"}', '::1', '2026-04-10 16:00:20'),
(16, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"guest.full.1775836820@testmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"26\"}', '::1', '2026-04-10 16:00:20'),
(17, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"tahamoata@gmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"27\"}', '::1', '2026-04-10 17:44:02'),
(18, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"tahamoata@gmail.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"27\"}', '::1', '2026-04-10 17:44:11'),
(19, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"admin@sakan.app\",\"reason\":\"Invalid credentials\",\"userId\":\"15\"}', '::1', '2026-04-10 18:22:07'),
(20, 15, 'PATCH /users/:id/review-id', 'users', '28', NULL, '::1', '2026-04-10 18:24:23'),
(21, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"29\"}', '::ffff:192.168.1.5', '2026-04-10 21:51:48'),
(22, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"29\"}', '::ffff:192.168.1.5', '2026-04-10 21:52:25'),
(23, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"29\"}', '::ffff:192.168.1.5', '2026-04-10 21:52:48'),
(24, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"29\"}', '::ffff:192.168.1.5', '2026-04-10 21:52:49'),
(25, 15, 'PATCH /users/:id/toggle-admin', 'users', '33', NULL, '::1', '2026-04-19 18:07:27'),
(26, 15, 'PATCH /users/:id/toggle-admin', 'users', '33', NULL, '::1', '2026-04-19 18:07:29'),
(27, 15, 'PATCH /users/:id/toggle-active', 'users', '33', NULL, '::1', '2026-04-19 18:07:30'),
(28, 15, 'PATCH /users/:id/toggle-active', 'users', '33', NULL, '::1', '2026-04-19 18:07:31'),
(29, 15, 'POST /send-test-email', 'send-test-email', NULL, NULL, '::1', '2026-04-19 18:10:44'),
(30, 15, 'POST /send-email-blast', 'send-email-blast', NULL, NULL, '::1', '2026-04-19 18:11:20'),
(31, 15, 'POST /expenses', 'expenses', NULL, NULL, '::1', '2026-04-19 18:20:38'),
(32, 15, 'DELETE /expenses/:id', 'expenses', '1', NULL, '::1', '2026-04-19 18:20:59'),
(33, 15, 'PATCH /settings/maintenance_mode', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:16'),
(34, 15, 'PATCH /settings/maintenance_mode', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:21'),
(35, 15, 'PATCH /settings/property_guest_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:46'),
(36, 15, 'PATCH /settings/property_host_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:46'),
(37, 15, 'PATCH /settings/consultation_user_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:46'),
(38, 15, 'PATCH /settings/consultation_consultant_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:46'),
(39, 15, 'PATCH /settings/consultation_consultant_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:47'),
(40, 15, 'PATCH /settings/consultation_consultant_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:48'),
(41, 15, 'PATCH /settings/consultation_user_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:49'),
(42, 15, 'PATCH /settings/property_host_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:49'),
(43, 15, 'PATCH /settings/property_guest_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:50'),
(44, 15, 'PATCH /settings/consultation_consultant_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:51'),
(45, 15, 'PATCH /settings/consultation_consultant_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:54'),
(46, 15, 'PATCH /settings/property_guest_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:54'),
(47, 15, 'PATCH /settings/property_host_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:54'),
(48, 15, 'PATCH /settings/consultation_user_fee_pct', 'settings', NULL, NULL, '::1', '2026-04-19 18:23:54'),
(49, 15, 'DELETE /properties/:id', 'properties', '195', NULL, '::1', '2026-04-19 18:52:50'),
(50, 15, 'DELETE /properties/:id', 'properties', '196', NULL, '::1', '2026-04-19 18:52:56'),
(51, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"admin@sakan.com\",\"reason\":\"Invalid credentials\",\"userId\":null}', '::1', '2026-04-23 07:38:53'),
(52, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"admin@sakan.app\",\"reason\":\"Invalid credentials\",\"userId\":\"15\"}', '::1', '2026-04-23 07:46:42'),
(53, 15, 'PATCH /settings/maintenance_mode', 'settings', NULL, NULL, '::1', '2026-04-23 08:51:15'),
(54, 15, 'PATCH /settings/maintenance_message', 'settings', NULL, NULL, '::1', '2026-04-23 08:51:19'),
(55, 15, 'PATCH /settings/maintenance_mode', 'settings', NULL, NULL, '::1', '2026-04-23 09:02:50'),
(56, 15, 'PATCH /settings/maintenance_mode', 'settings', NULL, NULL, '::1', '2026-04-23 09:02:51'),
(57, 15, 'PATCH /settings/maintenance_message', 'settings', NULL, NULL, '::1', '2026-04-23 09:05:03'),
(58, 15, 'PATCH /settings/maintenance_message', 'settings', NULL, NULL, '::1', '2026-04-23 09:05:15'),
(59, 15, 'PATCH /settings/maintenance_mode', 'settings', NULL, NULL, '::1', '2026-04-23 09:13:16'),
(60, 15, 'PATCH /settings/maintenance_mode', 'settings', NULL, NULL, '::1', '2026-04-23 09:14:40'),
(61, 15, 'PATCH /settings/maintenance_mode', 'settings', NULL, NULL, '::1', '2026-04-23 09:15:01'),
(62, 15, 'DELETE /properties/:id', 'properties', '197', NULL, '::1', '2026-04-23 09:16:34'),
(63, 15, 'DELETE /properties/:id', 'properties', '198', NULL, '::1', '2026-04-23 09:16:36'),
(64, 15, 'DELETE /properties/:id', 'properties', '199', NULL, '::1', '2026-04-23 09:16:37'),
(65, 15, 'DELETE /properties/:id', 'properties', '200', NULL, '::1', '2026-04-23 09:16:40'),
(66, 15, 'DELETE /properties/:id', 'properties', '201', NULL, '::1', '2026-04-23 09:16:42'),
(67, 15, 'DELETE /properties/:id', 'properties', '202', NULL, '::1', '2026-04-23 09:16:45'),
(68, 15, 'DELETE /properties/:id', 'properties', '203', NULL, '::1', '2026-04-23 09:16:47'),
(69, 15, 'DELETE /properties/:id', 'properties', '204', NULL, '::1', '2026-04-23 09:16:49'),
(70, 15, 'DELETE /properties/:id', 'properties', '205', NULL, '::1', '2026-04-23 09:16:50'),
(71, 15, 'DELETE /properties/:id', 'properties', '206', NULL, '::1', '2026-04-23 09:16:52'),
(72, 15, 'DELETE /properties/:id', 'properties', '207', NULL, '::1', '2026-04-23 09:16:54'),
(73, 15, 'DELETE /properties/:id', 'properties', '208', NULL, '::1', '2026-04-23 09:16:56'),
(74, 15, 'DELETE /properties/:id', 'properties', '209', NULL, '::1', '2026-04-23 09:16:57'),
(75, 15, 'DELETE /properties/:id', 'properties', '210', NULL, '::1', '2026-04-23 09:16:59'),
(76, 15, 'DELETE /properties/:id', 'properties', '211', NULL, '::1', '2026-04-23 09:17:00'),
(77, 15, 'DELETE /properties/:id', 'properties', '212', NULL, '::1', '2026-04-23 09:17:02'),
(78, 15, 'DELETE /properties/:id', 'properties', '213', NULL, '::1', '2026-04-23 09:17:04'),
(79, 15, 'DELETE /properties/:id', 'properties', '214', NULL, '::1', '2026-04-23 09:17:05'),
(80, 15, 'DELETE /properties/:id', 'properties', '215', NULL, '::1', '2026-04-23 09:17:07'),
(81, 15, 'DELETE /properties/:id', 'properties', '216', NULL, '::1', '2026-04-23 09:17:09'),
(82, 15, 'DELETE /properties/:id', 'properties', '217', NULL, '::1', '2026-04-23 09:17:11'),
(83, 15, 'DELETE /properties/:id', 'properties', '218', NULL, '::1', '2026-04-23 09:17:12'),
(84, 15, 'DELETE /properties/:id', 'properties', '219', NULL, '::1', '2026-04-23 09:17:15'),
(85, 15, 'DELETE /properties/:id', 'properties', '220', NULL, '::1', '2026-04-23 09:17:17'),
(86, 15, 'DELETE /properties/:id', 'properties', '180', NULL, '::1', '2026-04-23 09:17:23'),
(87, 15, 'DELETE /properties/:id', 'properties', '179', NULL, '::1', '2026-04-23 09:17:24'),
(88, 15, 'DELETE /properties/:id', 'properties', '178', NULL, '::1', '2026-04-23 09:17:26'),
(89, 15, 'DELETE /properties/:id', 'properties', '177', NULL, '::1', '2026-04-23 09:17:29'),
(90, 15, 'DELETE /properties/:id', 'properties', '181', NULL, '::1', '2026-04-23 09:17:30'),
(91, 15, 'DELETE /properties/:id', 'properties', '176', NULL, '::1', '2026-04-23 09:17:32'),
(92, 15, 'DELETE /properties/:id', 'properties', '183', NULL, '::1', '2026-04-23 09:17:34'),
(93, 15, 'DELETE /properties/:id', 'properties', '184', NULL, '::1', '2026-04-23 09:17:36'),
(94, 15, 'DELETE /properties/:id', 'properties', '185', NULL, '::1', '2026-04-23 09:17:38'),
(95, 15, 'DELETE /properties/:id', 'properties', '186', NULL, '::1', '2026-04-23 09:17:41'),
(96, 15, 'DELETE /properties/:id', 'properties', '182', NULL, '::1', '2026-04-23 09:17:43'),
(97, 15, 'DELETE /properties/:id', 'properties', '189', NULL, '::1', '2026-04-23 09:17:44'),
(98, 15, 'DELETE /properties/:id', 'properties', '191', NULL, '::1', '2026-04-23 09:17:46'),
(99, 15, 'DELETE /properties/:id', 'properties', '193', NULL, '::1', '2026-04-23 09:17:48'),
(100, 15, 'DELETE /properties/:id', 'properties', '194', NULL, '::1', '2026-04-23 09:17:50'),
(101, 15, 'DELETE /properties/:id', 'properties', '190', NULL, '::1', '2026-04-23 09:17:51'),
(102, 15, 'DELETE /properties/:id', 'properties', '187', NULL, '::1', '2026-04-23 09:17:53'),
(103, 15, 'DELETE /properties/:id', 'properties', '174', NULL, '::1', '2026-04-23 09:17:54'),
(104, 15, 'DELETE /properties/:id', 'properties', '173', NULL, '::1', '2026-04-23 09:17:56'),
(105, 15, 'DELETE /properties/:id', 'properties', '171', NULL, '::1', '2026-04-23 09:17:58'),
(106, 15, 'DELETE /properties/:id', 'properties', '170', NULL, '::1', '2026-04-23 09:18:00'),
(107, 15, 'DELETE /properties/:id', 'properties', '168', NULL, '::1', '2026-04-23 09:18:02'),
(108, 15, 'DELETE /properties/:id', 'properties', '169', NULL, '::1', '2026-04-23 09:18:05'),
(109, 15, 'DELETE /properties/:id', 'properties', '166', NULL, '::1', '2026-04-23 09:18:07'),
(110, 15, 'DELETE /properties/:id', 'properties', '175', NULL, '::1', '2026-04-23 09:18:09'),
(111, 15, 'DELETE /properties/:id', 'properties', '163', NULL, '::1', '2026-04-23 09:18:12'),
(112, 15, 'DELETE /properties/:id', 'properties', '164', NULL, '::1', '2026-04-23 09:18:16'),
(113, 15, 'DELETE /properties/:id', 'properties', '161', NULL, '::1', '2026-04-23 09:18:20'),
(114, 15, 'DELETE /properties/:id', 'properties', '162', NULL, '::1', '2026-04-23 09:18:21'),
(115, 15, 'DELETE /properties/:id', 'properties', '167', NULL, '::1', '2026-04-23 09:18:28'),
(116, 15, 'DELETE /properties/:id', 'properties', '188', NULL, '::1', '2026-04-23 09:18:31'),
(117, 15, 'DELETE /properties/:id', 'properties', '172', NULL, '::1', '2026-04-23 09:18:33'),
(118, 15, 'DELETE /properties/:id', 'properties', '192', NULL, '::1', '2026-04-23 09:18:34'),
(119, 15, 'PATCH /users/:id/review-id', 'users', '33', NULL, '::1', '2026-04-23 09:23:59'),
(120, 15, 'DELETE /properties/:id', 'properties', '165', NULL, '::1', '2026-04-23 09:25:45'),
(121, 15, 'PATCH /properties/:id/status', 'properties', '239', NULL, '::1', '2026-04-23 11:01:48'),
(122, 15, 'PATCH /properties/:id/status', 'properties', '239', NULL, '::1', '2026-04-23 11:02:16'),
(123, 15, 'PATCH /properties/:id/status', 'properties', '245', NULL, '::1', '2026-04-23 12:57:08'),
(124, 15, 'PATCH /properties/:id/status', 'properties', '246', NULL, '::1', '2026-04-23 14:31:34'),
(125, 15, 'PATCH /properties/:id/status', 'properties', '246', NULL, '::1', '2026-04-23 14:50:22'),
(126, 15, 'PATCH /properties/:id/status', 'properties', '246', NULL, '::1', '2026-04-23 14:50:25'),
(127, 15, 'PATCH /properties/:id/status', 'properties', '247', NULL, '::1', '2026-04-23 15:20:36'),
(128, 15, 'PATCH /properties/:id/featured', 'properties', '247', NULL, '::1', '2026-04-23 15:39:22'),
(129, 15, 'PATCH /properties/:id/featured', 'properties', '247', NULL, '::1', '2026-04-23 15:45:07'),
(130, 15, 'PATCH /properties/:id/featured', 'properties', '247', NULL, '::1', '2026-04-23 15:45:08'),
(131, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Please verify your email before logging in\",\"userId\":\"34\"}', '::1', '2026-04-23 16:00:26'),
(132, 15, 'PATCH /properties/:id/status', 'properties', '247', NULL, '::1', '2026-04-24 13:29:17'),
(133, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Invalid credentials\",\"userId\":\"34\"}', '::1', '2026-04-24 13:31:02'),
(134, 15, 'POST /bookings/:id/confirm-payment', 'bookings', '46', NULL, '::1', '2026-04-24 23:08:05'),
(135, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Invalid credentials\",\"userId\":\"34\"}', '::1', '2026-04-25 19:35:48'),
(136, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Invalid credentials\",\"userId\":\"34\"}', '::1', '2026-04-25 19:36:32'),
(137, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"dbugerz@gmail.com\",\"reason\":\"Invalid credentials\",\"userId\":null}', '::1', '2026-04-25 19:38:37'),
(138, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Invalid credentials\",\"userId\":\"34\"}', '::1', '2026-04-26 06:41:49'),
(139, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"dbugerz@gmail.com\",\"reason\":\"Invalid credentials\",\"userId\":null}', '::1', '2026-04-26 08:45:37'),
(140, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"admin@sakan.com\",\"reason\":\"Invalid credentials\",\"userId\":null}', '::1', '2026-04-28 11:49:26'),
(141, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"admin@sakan.com\",\"reason\":\"Invalid credentials\",\"userId\":null}', '::1', '2026-04-28 11:49:26'),
(142, 15, 'PATCH /properties/:id/status', 'properties', '247', NULL, '::1', '2026-04-28 11:50:30'),
(143, 15, 'PATCH /users/:id/ban', 'users', '34', NULL, '::1', '2026-04-28 12:02:06'),
(144, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Account is disabled\",\"userId\":\"34\"}', '::1', '2026-04-28 12:02:48'),
(145, 15, 'PATCH /users/:id/toggle-active', 'users', '34', NULL, '::1', '2026-04-28 12:03:06'),
(146, 15, 'PATCH /users/:id/toggle-active', 'users', '34', NULL, '::1', '2026-04-28 12:03:10'),
(147, 15, 'PATCH /users/:id/toggle-active', 'users', '34', NULL, '::1', '2026-04-28 12:03:12'),
(148, 15, 'PATCH /users/:id/ban', 'users', '34', NULL, '::1', '2026-04-28 12:03:16'),
(149, 15, 'DELETE /users/:id', 'users', '7', NULL, '::1', '2026-04-28 12:04:02'),
(150, 15, 'PATCH /properties/:id/status', 'properties', '253', NULL, '::1', '2026-04-28 12:34:47'),
(151, 15, 'POST /ical-sources/:id/sync', 'ical-sources', '3', NULL, '::1', '2026-04-28 12:41:18'),
(152, 15, 'PATCH /properties/:id/status', 'properties', '254', NULL, '::1', '2026-04-28 13:00:49'),
(153, 15, 'PATCH /properties/:id/status', 'properties', '253', NULL, '::1', '2026-04-28 13:00:52'),
(154, 15, 'PATCH /users/:id/toggle-active', 'users', '34', NULL, '::1', '2026-04-28 13:03:45'),
(155, 15, 'PATCH /users/:id/toggle-active', 'users', '34', NULL, '::1', '2026-04-28 13:03:47'),
(156, 15, 'PATCH /users/:id/toggle-active', 'users', '34', NULL, '::1', '2026-04-28 13:04:21'),
(157, 15, 'PATCH /users/:id/ban', 'users', '34', NULL, '::1', '2026-04-28 13:04:26'),
(158, 15, 'PATCH /users/:id/toggle-active', 'users', '34', NULL, '::1', '2026-04-28 13:04:50'),
(159, 15, 'PATCH /users/:id/toggle-active', 'users', '34', NULL, '::1', '2026-04-28 13:04:59'),
(160, NULL, 'AUTH_FAILED_LOGIN', 'auth', NULL, '{\"email\":\"taha@bme-global.com\",\"reason\":\"Account is disabled\",\"userId\":\"34\"}', '::1', '2026-04-28 13:59:15'),
(161, 15, 'PATCH /disputes/:id/status', 'disputes', '4', NULL, '::1', '2026-04-28 14:01:21'),
(162, 15, 'PATCH /users/:id/toggle-active', 'users', '34', NULL, '::1', '2026-04-28 14:01:31'),
(163, 15, 'PATCH /reviews/:id/flag', 'reviews', '6', NULL, '::1', '2026-04-28 17:22:59'),
(164, 15, 'PATCH /reviews/:id/flag', 'reviews', '6', NULL, '::1', '2026-04-28 17:23:01'),
(165, 15, 'PATCH /reviews/:id/flag', 'reviews', '6', NULL, '::1', '2026-04-28 17:23:02'),
(166, 15, 'PATCH /reviews/:id/flag', 'reviews', '6', NULL, '::1', '2026-04-28 17:23:03'),
(167, 15, 'PATCH /properties/:id/status', 'properties', '255', NULL, '::1', '2026-04-28 17:26:08'),
(168, 15, 'PATCH /properties/:id/status', 'properties', '256', NULL, '::1', '2026-04-28 17:26:25'),
(169, 15, 'PATCH /properties/:id/status', 'properties', '257', NULL, '::1', '2026-04-28 17:26:30'),
(170, 15, 'PATCH /users/:id/review-id', 'users', '35', NULL, '::1', '2026-04-30 10:11:43'),
(171, 15, 'PATCH /properties/:id/status', 'properties', '259', NULL, '::1', '2026-04-30 10:16:21'),
(172, 15, 'POST /bookings/:id/confirm-payment', 'bookings', '49', NULL, '::1', '2026-04-30 10:33:16'),
(173, 15, 'PATCH /users/:id/review-id', 'users', '37', NULL, '::1', '2026-05-02 21:58:31'),
(174, 15, 'PATCH /properties/:id/status', 'properties', '260', NULL, '::1', '2026-05-02 22:11:20'),
(175, 15, 'PATCH /properties/:id/status', 'properties', '260', NULL, '::1', '2026-05-02 22:16:30'),
(176, 15, 'PATCH /users/:id/review-id', 'users', '38', NULL, '::1', '2026-05-03 04:07:23'),
(177, 15, 'POST /bookings/:id/confirm-payment', 'bookings', '52', NULL, '::1', '2026-05-03 04:20:12'),
(178, 15, 'POST /bookings/:id/mark-instapay-refunded', 'bookings', '52', NULL, '::1', '2026-05-03 04:21:21'),
(179, 15, 'PATCH /users/:id/review-id', 'users', '40', NULL, '::1', '2026-05-05 16:22:20'),
(180, 15, 'PATCH /properties/:id/status', 'properties', '261', NULL, '::1', '2026-05-05 16:28:45'),
(181, 15, 'PATCH /properties/:id/status', 'properties', '261', NULL, '::1', '2026-05-05 16:29:29'),
(182, 15, 'PATCH /properties/:id/status', 'properties', '261', NULL, '::1', '2026-05-05 16:29:55');

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

-- --------------------------------------------------------

--
-- Table structure for table `blocked_users`
--

CREATE TABLE `blocked_users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `blocker_id` bigint(20) UNSIGNED NOT NULL,
  `blocked_user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `deposit_status` enum('none','held','claimed','released','approved','rejected') NOT NULL DEFAULT 'none' COMMENT 'none=no deposit; held=collected by host at checkout; claimed=host filed damage claim; approved=claim approved by admin; rejected=claim rejected; released=deposit returned to guest',
  `deposit_claim_deadline` datetime DEFAULT NULL,
  `deposit_released_at` datetime DEFAULT NULL,
  `deposit_claim_reason` text DEFAULT NULL,
  `deposit_claim_evidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`deposit_claim_evidence`)),
  `currency` char(3) NOT NULL DEFAULT 'EGP',
  `display_currency` varchar(3) DEFAULT NULL,
  `status` enum('pending','confirmed','in_progress','completed','cancelled','declined') NOT NULL DEFAULT 'pending',
  `house_rules_acknowledged` tinyint(1) DEFAULT 0,
  `house_rules_acknowledged_at` datetime DEFAULT NULL,
  `payment_status` enum('pending','submitted','paid','refund_pending','refunded','refund_failed','declined') NOT NULL DEFAULT 'pending',
  `payment_method` enum('instapay','cash','card','opay-card') DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `payment_note` text DEFAULT NULL,
  `payment_proof_url` varchar(500) DEFAULT NULL,
  `proof_viewed_at` datetime DEFAULT NULL,
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
  `host_note` varchar(2000) DEFAULT NULL,
  `host_check_in_instructions` text DEFAULT NULL,
  `special_requests` varchar(2000) DEFAULT NULL,
  `refund_reason` varchar(500) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL COMMENT 'Set when booking moves to confirmed status',
  `completed_at` datetime DEFAULT NULL COMMENT 'Set when booking is marked completed (by scheduler or manually)',
  `payment_reminder_sent_at` datetime DEFAULT NULL COMMENT 'Timestamp of the +4h payment reminder; prevents duplicate sends',
  `modification_history` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`modification_history`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `price_per_night` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `discount_type` varchar(40) DEFAULT NULL,
  `nightly_rates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Per-night price breakdown [{date,price}] stored at booking creation time' CHECK (json_valid(`nightly_rates`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- --------------------------------------------------------

--
-- Table structure for table `booking_status_history`
--

CREATE TABLE `booking_status_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `from_status` varchar(30) DEFAULT NULL COMMENT 'NULL for initial creation',
  `to_status` varchar(30) NOT NULL,
  `changed_by_id` bigint(20) UNSIGNED DEFAULT NULL,
  `changed_by_role` enum('guest','host','admin','system') NOT NULL DEFAULT 'system',
  `reason` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `disputes`
--

CREATE TABLE `disputes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(36) NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `raised_by_id` bigint(20) UNSIGNED NOT NULL,
  `category` enum('property_not_as_described','no_show','safety_concern','refund_request','damage_claim','other') NOT NULL DEFAULT 'other',
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `status` enum('open','under_review','resolved','closed') NOT NULL DEFAULT 'open',
  `resolution` enum('resolved_for_guest','resolved_for_host','dismissed','split') DEFAULT NULL,
  `admin_note` text DEFAULT NULL,
  `assigned_to_id` bigint(20) UNSIGNED DEFAULT NULL,
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `sla_deadline` datetime DEFAULT NULL,
  `additional_info` text DEFAULT NULL,
  `evidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence`)),
  `host_evidence` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Evidence files uploaded by the host (separate from guest evidence)' CHECK (json_valid(`host_evidence`)),
  `appeal_requested` tinyint(1) NOT NULL DEFAULT 0,
  `appeal_reason` text DEFAULT NULL,
  `appealed_at` datetime DEFAULT NULL,
  `appeal_reviewed_by_id` bigint(20) UNSIGNED DEFAULT NULL,
  `appeal_resolution` text DEFAULT NULL,
  `appeal_resolved_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `payment_method` enum('instapay','cash','card','opay-card') DEFAULT NULL,
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
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

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
-- Table structure for table `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('charge','refund','partial_refund') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'EGP',
  `gateway` enum('stripe','opay','instapay','cash','bank_transfer') NOT NULL,
  `gateway_reference` varchar(255) DEFAULT NULL COMMENT 'External payment gateway transaction ID',
  `status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
  `failure_reason` varchar(500) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Gateway-specific response data' CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
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
  `account_details` text DEFAULT NULL,
  `is_auto` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `note` varchar(1000) DEFAULT NULL,
  `transfer_reference` varchar(255) DEFAULT NULL COMMENT 'Bank transfer / InstaPay / OPay transaction reference',
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payout_items`
--

CREATE TABLE `payout_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `payout_id` bigint(20) UNSIGNED NOT NULL,
  `earning_id` bigint(20) UNSIGNED DEFAULT NULL,
  `booking_id` bigint(20) UNSIGNED DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
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
(4, 'consultation_consultant_fee_pct', '5', 'Host commission % deducted from experience booking payout', '2026-04-06 21:46:39'),
(8, 'maintenance_mode', 'false', NULL, '2026-04-23 09:15:01'),
(9, 'maintenance_message', 'Platform is under maintenance. Please try again later.', NULL, '2026-04-23 09:05:14');

-- --------------------------------------------------------

--
-- Table structure for table `price_alerts`
--

CREATE TABLE `price_alerts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `target_price` decimal(10,2) NOT NULL,
  `last_known_price` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `notified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `space_type` enum('entire_place','private_room','shared_room','hotel_room','hotel_suite') NOT NULL DEFAULT 'entire_place',
  `property_kind` varchar(100) NOT NULL DEFAULT 'apartment',
  `price_per_night` decimal(10,2) DEFAULT NULL,
  `weekend_price` decimal(10,2) DEFAULT NULL,
  `weekly_discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `monthly_discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `new_listing_promotion_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `last_minute_discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `booking_mode` enum('instant_book','approve_first_three','always_approve') NOT NULL DEFAULT 'instant_book',
  `approved_bookings_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `currency` char(3) NOT NULL DEFAULT 'EGP',
  `cleaning_fee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `security_deposit` decimal(10,2) NOT NULL DEFAULT 0.00,
  `service_fee_percent` decimal(5,2) NOT NULL DEFAULT 5.00,
  `host_commission_percent` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '0% = host keeps full nightly amount; only guests pay service_fee_percent',
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
  `deleted_at` datetime DEFAULT NULL,
  `uuid` varchar(36) DEFAULT NULL,
  `geo_point` point NOT NULL,
  `require_verified_guest` tinyint(1) NOT NULL DEFAULT 0,
  `min_guest_rating` decimal(2,1) DEFAULT NULL,
  `wifi_name` varchar(100) DEFAULT NULL,
  `wifi_password` varchar(100) DEFAULT NULL,
  `door_code` varchar(50) DEFAULT NULL,
  `wizard_last_step` int(11) NOT NULL DEFAULT 0 COMMENT 'Highest wizard step saved for this listing (0 = legacy/unknown)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

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

-- --------------------------------------------------------

--
-- Table structure for table `property_price_history`
--

CREATE TABLE `property_price_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `property_id` bigint(20) UNSIGNED NOT NULL,
  `base_price` decimal(10,2) NOT NULL,
  `recorded_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `booking_id` bigint(20) UNSIGNED NOT NULL,
  `reviewer_id` bigint(20) UNSIGNED NOT NULL,
  `reviewer_role` enum('guest','host') NOT NULL DEFAULT 'guest' COMMENT 'guest = guest reviewing property; host = host reviewing guest',
  `reviewed_user_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Populated for host→guest reviews; the guest being reviewed',
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
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` enum('admin','guest','host') DEFAULT NULL,
  `host_reply` text DEFAULT NULL,
  `host_replied_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Table structure for table `saved_searches`
--

CREATE TABLE `saved_searches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`filters`)),
  `alert_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `last_alerted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `unified_audit_logs`
-- (See below for the actual view)
--
CREATE TABLE `unified_audit_logs` (
`log_source` varchar(5)
,`id` bigint(20) unsigned
,`actor_id` bigint(20) unsigned
,`action` varchar(120)
,`entity_type` varchar(60)
,`entity_id` varchar(60)
,`details` longtext
,`ip_address` varchar(45)
,`created_at` datetime(6)
);

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
  `id_document_back_url` varchar(500) DEFAULT NULL,
  `id_document_type` enum('national_id','passport') NOT NULL DEFAULT 'national_id',
  `id_verification_status` enum('none','pending','approved','rejected') NOT NULL DEFAULT 'none' COMMENT 'Current state of government ID verification',
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `preferred_language` enum('en','ar') NOT NULL DEFAULT 'en',
  `google_id` varchar(255) DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL COMMENT 'Non-null = account soft-deleted; PII anonymized, login blocked',
  `totp_secret` varchar(255) DEFAULT NULL COMMENT '2FA TOTP secret (null when 2FA not set up)',
  `is_totp_enabled` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether 2FA is active for this account',
  `last_login_at` datetime(6) DEFAULT NULL,
  `failed_login_attempts` smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `last_booking_at` datetime(6) DEFAULT NULL,
  `last_profile_edit_at` datetime(6) DEFAULT NULL,
  `host_cancelled_bookings_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `last_host_cancellation_at` datetime DEFAULT NULL,
  `auto_payout_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `auto_payout_frequency` enum('weekly','monthly') NOT NULL DEFAULT 'weekly',
  `auto_payout_day` tinyint(3) UNSIGNED DEFAULT NULL,
  `auto_payout_min_balance` decimal(10,2) NOT NULL DEFAULT 100.00,
  `auto_payout_method` enum('instapay','bank_transfer','cash') NOT NULL DEFAULT 'instapay',
  `auto_payout_account_details` text DEFAULT NULL,
  `notification_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notification_preferences`)),
  `auto_reply_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `auto_reply_message` varchar(500) DEFAULT NULL,
  `fcm_token` varchar(500) DEFAULT NULL,
  `average_response_minutes` decimal(10,1) NOT NULL DEFAULT 0.0,
  `response_rate` decimal(5,2) NOT NULL DEFAULT 100.00,
  `id_rejection_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `profile_uuid`, `email`, `password_hash`, `first_name`, `last_name`, `avatar_url`, `phone`, `bio`, `date_of_birth`, `is_host`, `is_superhost`, `is_consultant`, `is_email_verified`, `is_phone_verified`, `is_id_verified`, `id_document_url`, `id_document_back_url`, `id_document_type`, `id_verification_status`, `is_admin`, `is_active`, `preferred_language`, `google_id`, `refresh_token`, `created_at`, `updated_at`, `deleted_at`, `totp_secret`, `is_totp_enabled`, `last_login_at`, `failed_login_attempts`, `locked_until`, `last_booking_at`, `last_profile_edit_at`, `host_cancelled_bookings_count`, `last_host_cancellation_at`, `auto_payout_enabled`, `auto_payout_frequency`, `auto_payout_day`, `auto_payout_min_balance`, `auto_payout_method`, `auto_payout_account_details`, `notification_preferences`, `auto_reply_enabled`, `auto_reply_message`, `fcm_token`, `average_response_minutes`, `response_rate`, `id_rejection_reason`) VALUES
(15, 'c2f17e01-26ed-11f1-8811-84a938fc7bd1', 'admin@sakan.app', '$2b$10$qhup6zWen75uuBiJICCb4.RUKGGU8pE91LjfZI/apirVgF.5I0Lm6', 'Admin', 'Sakan', NULL, NULL, 'Platform administrator', NULL, 1, 0, 0, 1, 0, 0, NULL, NULL, 'national_id', 'none', 1, 1, 'en', NULL, '$2b$10$MbGTjZBfbLSIAZ0/MHYqi.kwfHdZlKxwU9BwsqnerBIeHVmjndNCG', '2026-03-23 11:21:24', '2026-05-06 01:24:45', NULL, NULL, 0, '2026-05-05 20:46:23.569000', 0, NULL, NULL, NULL, 0, NULL, 0, 'weekly', NULL, 100.00, 'instapay', NULL, NULL, 0, NULL, NULL, 0.0, 100.00, NULL),
(37, 'bfd7268b-6a6e-45cf-b41e-77e764da7d65', 'oikivo.support@gmail.com', '$2b$12$OGAAYaqmoLxk3ZhIQDTseuf0KngOFZhbO3yW/K14vXallzox.A/Xu', 'Oikivo', '', 'https://lh3.googleusercontent.com/a/ACg8ocIEtHaerdKPumc8Zt6qqMm1erYhs0zUaOLbwcLYa-UUbntn0b0=s400-c', '+201153450921', '', NULL, 1, 0, 0, 1, 0, 1, '/uploads/id-documents/id-1777754117405-548991430.jpg', '/uploads/id-documents/id-back-1777754117453-723683007.png', 'national_id', 'approved', 0, 1, 'en', '106051725765162573852', '$2b$10$TQXLPdWhjbaN5taXN4a8LukMpQ/r.fe.4nRIJg0O0opVNz1uEe1JK', '2026-05-02 23:30:42', '2026-05-06 03:16:40', NULL, 'MYACGNC3EUOUCBAJ', 1, '2026-05-03 05:14:27.741000', 0, NULL, NULL, '2026-05-03 04:27:54.257000', 0, NULL, 0, 'weekly', NULL, 100.00, 'instapay', NULL, NULL, 0, NULL, NULL, 9.0, 50.00, NULL),
(43, '5c8ac8f2-c0f8-4bd9-a296-fc5dc57802cc', 'tahamoataz5@gmail.com', NULL, 'taha', 'moataz', 'https://lh3.googleusercontent.com/a/ACg8ocIhokSZ7I-yDtXC4sLNCE8-xCGOriQx5JjDqruvwAn73AvoaWOg=s400-c', NULL, NULL, NULL, 0, 0, 0, 1, 0, 0, NULL, NULL, 'national_id', 'none', 0, 1, 'en', '111444434132856504879', '$2b$10$Emd4cdxVvYfHiPYDjhCYY.wKSw8.bWews01GyuV2ZSfcNa264/kXS', '2026-05-10 10:28:20', '2026-05-10 10:28:20', NULL, NULL, 0, NULL, 0, NULL, NULL, NULL, 0, NULL, 0, 'weekly', NULL, 100.00, 'instapay', NULL, NULL, 0, NULL, NULL, 0.0, 100.00, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_reports`
--

CREATE TABLE `user_reports` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `reporter_id` bigint(20) UNSIGNED NOT NULL,
  `reported_user_id` bigint(20) UNSIGNED NOT NULL,
  `report_type` enum('spam','harassment','inappropriate','fraud','other') NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `reviewed_by_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `os_name` varchar(100) DEFAULT NULL,
  `device_name` varchar(150) DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_active_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(36) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL DEFAULT 'Wishlist',
  `visibility` enum('private','public') NOT NULL DEFAULT 'private',
  `share_token` varchar(36) DEFAULT NULL,
  `cover_photo` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- --------------------------------------------------------

--
-- Structure for view `unified_audit_logs`
--
DROP TABLE IF EXISTS `unified_audit_logs`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `unified_audit_logs`  AS SELECT 'user' AS `log_source`, `al`.`id` AS `id`, `al`.`actor_id` AS `actor_id`, `al`.`event_type` AS `action`, `al`.`entity_type` AS `entity_type`, `al`.`entity_id` AS `entity_id`, `al`.`metadata` AS `details`, `al`.`ip_address` AS `ip_address`, `al`.`created_at` AS `created_at` FROM `audit_logs` AS `al`union all select 'admin' AS `log_source`,`aal`.`id` AS `id`,`aal`.`admin_id` AS `actor_id`,`aal`.`action` AS `action`,`aal`.`entity_type` AS `entity_type`,`aal`.`entity_id` AS `entity_id`,`aal`.`details` AS `details`,`aal`.`ip_address` AS `ip_address`,`aal`.`created_at` AS `created_at` from `admin_activity_logs` `aal`  ;

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
-- Indexes for table `blocked_users`
--
ALTER TABLE `blocked_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_block` (`blocker_id`,`blocked_user_id`),
  ADD KEY `idx_blocker` (`blocker_id`),
  ADD KEY `idx_blocked` (`blocked_user_id`);

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
  ADD KEY `idx_bookings_host_status` (`host_id`,`status`),
  ADD KEY `idx_bookings_prop_status_checkin` (`property_id`,`status`,`check_in`),
  ADD KEY `idx_bookings_guest_status` (`guest_id`,`status`),
  ADD KEY `idx_bookings_property_status` (`property_id`,`status`),
  ADD KEY `idx_bookings_payment_status` (`payment_status`),
  ADD KEY `idx_bookings_checkin` (`check_in`),
  ADD KEY `idx_bookings_checkout` (`check_out`);

--
-- Indexes for table `booking_status_history`
--
ALTER TABLE `booking_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bsh_booking` (`booking_id`),
  ADD KEY `idx_bsh_booking_created` (`booking_id`,`created_at`),
  ADD KEY `fk_bsh_changed_by` (`changed_by_id`);

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
  ADD KEY `idx_conversations_guest` (`guest_id`),
  ADD KEY `idx_conversations_last_message` (`updated_at`),
  ADD KEY `idx_conversations_updated` (`updated_at`);

--
-- Indexes for table `disputes`
--
ALTER TABLE `disputes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_disputes_uuid` (`uuid`),
  ADD KEY `idx_disputes_booking` (`booking_id`),
  ADD KEY `idx_disputes_raised_by` (`raised_by_id`),
  ADD KEY `idx_disputes_status` (`status`),
  ADD KEY `idx_disputes_assigned_to` (`assigned_to_id`),
  ADD KEY `idx_disputes_priority` (`priority`);

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
  ADD KEY `idx_messages_conversation_time` (`conversation_id`,`created_at`),
  ADD KEY `idx_messages_conversation_created` (`conversation_id`,`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`),
  ADD KEY `idx_notifications_read` (`user_id`,`is_read`),
  ADD KEY `idx_notifications_user_time` (`user_id`,`created_at`),
  ADD KEY `idx_notifications_user_unread` (`user_id`,`is_read`,`created_at`),
  ADD KEY `idx_notifications_user_read` (`user_id`,`is_read`),
  ADD KEY `idx_notifications_read_created` (`is_read`,`created_at`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pt_booking` (`booking_id`),
  ADD KEY `idx_pt_gateway_ref` (`gateway`,`gateway_reference`),
  ADD KEY `idx_pt_status_created` (`status`,`created_at`);

--
-- Indexes for table `payouts`
--
ALTER TABLE `payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payouts_host` (`host_id`),
  ADD KEY `idx_payouts_status` (`status`);

--
-- Indexes for table `payout_items`
--
ALTER TABLE `payout_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pi_payout` (`payout_id`),
  ADD KEY `idx_pi_earning` (`earning_id`),
  ADD KEY `idx_pi_booking` (`booking_id`);

--
-- Indexes for table `platform_settings`
--
ALTER TABLE `platform_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UQ_platform_settings_key` (`key`);

--
-- Indexes for table `price_alerts`
--
ALTER TABLE `price_alerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_price_alerts_user` (`user_id`),
  ADD KEY `idx_price_alerts_property` (`property_id`);

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
  ADD KEY `idx_properties_country_city` (`country_code`,`city`,`is_active`),
  ADD KEY `idx_properties_featured` (`is_featured`,`status`),
  ADD KEY `idx_properties_host_status_active` (`host_id`,`status`,`is_active`),
  ADD KEY `idx_properties_city_status_active` (`city`,`status`,`is_active`),
  ADD KEY `idx_properties_status_active` (`status`,`is_active`);

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
  ADD KEY `fk_av_ical_source` (`ical_source_id`),
  ADD KEY `idx_availability_property_date` (`property_id`,`date`);

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
-- Indexes for table `property_price_history`
--
ALTER TABLE `property_price_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_price_history_prop_date` (`property_id`,`recorded_at`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_reviews_booking_role` (`booking_id`,`reviewer_role`),
  ADD UNIQUE KEY `uq_review_booking_role` (`booking_id`,`reviewer_role`),
  ADD KEY `idx_reviews_property` (`property_id`),
  ADD KEY `idx_reviews_reviewer` (`reviewer_id`),
  ADD KEY `idx_reviews_property_date` (`property_id`,`created_at`),
  ADD KEY `idx_reviews_property_deleted` (`property_id`,`is_deleted`);

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
  ADD KEY `idx_users_is_consultant` (`is_consultant`),
  ADD KEY `idx_users_consultant` (`is_consultant`,`is_active`);

--
-- Indexes for table `user_reports`
--
ALTER TABLE `user_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reporter` (`reporter_id`),
  ADD KEY `idx_reported` (`reported_user_id`),
  ADD KEY `idx_report_status` (`status`);

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
  ADD UNIQUE KEY `idx_wishlists_uuid` (`uuid`),
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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=183;

--
-- AUTO_INCREMENT for table `amenities`
--
ALTER TABLE `amenities`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `blocked_users`
--
ALTER TABLE `blocked_users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=626;

--
-- AUTO_INCREMENT for table `booking_status_history`
--
ALTER TABLE `booking_status_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=715;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `cohosts`
--
ALTER TABLE `cohosts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=301;

--
-- AUTO_INCREMENT for table `consultants`
--
ALTER TABLE `consultants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=302;

--
-- AUTO_INCREMENT for table `disputes`
--
ALTER TABLE `disputes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=302;

--
-- AUTO_INCREMENT for table `earnings`
--
ALTER TABLE `earnings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=303;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=710;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=817;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=908;

--
-- AUTO_INCREMENT for table `payouts`
--
ALTER TABLE `payouts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=302;

--
-- AUTO_INCREMENT for table `payout_items`
--
ALTER TABLE `payout_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=303;

--
-- AUTO_INCREMENT for table `platform_settings`
--
ALTER TABLE `platform_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `price_alerts`
--
ALTER TABLE `price_alerts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=302;

--
-- AUTO_INCREMENT for table `properties`
--
ALTER TABLE `properties`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=301;

--
-- AUTO_INCREMENT for table `property_availability`
--
ALTER TABLE `property_availability`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=809;

--
-- AUTO_INCREMENT for table `property_house_rules`
--
ALTER TABLE `property_house_rules`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=705;

--
-- AUTO_INCREMENT for table `property_ical_sources`
--
ALTER TABLE `property_ical_sources`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=301;

--
-- AUTO_INCREMENT for table `property_photos`
--
ALTER TABLE `property_photos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=605;

--
-- AUTO_INCREMENT for table `property_price_history`
--
ALTER TABLE `property_price_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=303;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `saved_searches`
--
ALTER TABLE `saved_searches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=303;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `user_reports`
--
ALTER TABLE `user_reports`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `verification_tokens`
--
ALTER TABLE `verification_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=302;

--
-- AUTO_INCREMENT for table `wishlist_items`
--
ALTER TABLE `wishlist_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=303;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_activity_logs`
--
ALTER TABLE `admin_activity_logs`
  ADD CONSTRAINT `fk_activity_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `blocked_users`
--
ALTER TABLE `blocked_users`
  ADD CONSTRAINT `fk_blocked_users_blocked` FOREIGN KEY (`blocked_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_blocked_users_blocker` FOREIGN KEY (`blocker_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`guest_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `booking_status_history`
--
ALTER TABLE `booking_status_history`
  ADD CONSTRAINT `fk_bsh_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `fk_bsh_changed_by` FOREIGN KEY (`changed_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
  ADD CONSTRAINT `fk_disputes_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `fk_disputes_raised_by` FOREIGN KEY (`raised_by_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `earnings`
--
ALTER TABLE `earnings`
  ADD CONSTRAINT `earnings_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `earnings_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

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
-- Constraints for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD CONSTRAINT `fk_pt_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`);

--
-- Constraints for table `payouts`
--
ALTER TABLE `payouts`
  ADD CONSTRAINT `payouts_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `payout_items`
--
ALTER TABLE `payout_items`
  ADD CONSTRAINT `fk_pi_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  ADD CONSTRAINT `fk_pi_earning` FOREIGN KEY (`earning_id`) REFERENCES `earnings` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_pi_payout` FOREIGN KEY (`payout_id`) REFERENCES `payouts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `price_alerts`
--
ALTER TABLE `price_alerts`
  ADD CONSTRAINT `fk_price_alerts_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_price_alerts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`),
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
-- Constraints for table `property_price_history`
--
ALTER TABLE `property_price_history`
  ADD CONSTRAINT `fk_price_history_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `user_reports`
--
ALTER TABLE `user_reports`
  ADD CONSTRAINT `fk_user_reports_reported` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_reports_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
