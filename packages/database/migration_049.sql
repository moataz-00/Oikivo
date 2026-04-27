-- Migration 049: Align DB schema with entity fixes
-- DB-04: Remove unused 'stripe' and 'opay-wallet' from payment_method enums
-- DB-07: Fix properties.currency default to 'EGP'

-- DB-04: bookings payment_method — remove stripe and opay-wallet
ALTER TABLE `bookings`
  MODIFY COLUMN `payment_method` ENUM('instapay','cash','card','opay-card') DEFAULT NULL;

-- DB-04: experience_bookings payment_method — remove stripe and opay-wallet
ALTER TABLE `experience_bookings`
  MODIFY COLUMN `payment_method` ENUM('instapay','cash','card','opay-card') DEFAULT NULL;

-- DB-07: Align properties.currency default to 'EGP' (entity already uses 'EGP')
ALTER TABLE `properties`
  ALTER COLUMN `currency` SET DEFAULT 'EGP';
