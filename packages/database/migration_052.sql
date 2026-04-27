-- Migration 052: Add hotel_room/hotel_suite to space_type; add always_approve to booking_mode
-- Run this against sakan_db

ALTER TABLE `properties`
  MODIFY COLUMN `space_type`
    ENUM('entire_place','private_room','shared_room','hotel_room','hotel_suite')
    NOT NULL DEFAULT 'entire_place';

ALTER TABLE `properties`
  MODIFY COLUMN `booking_mode`
    ENUM('instant_book','approve_first_three','always_approve')
    NOT NULL DEFAULT 'instant_book';
