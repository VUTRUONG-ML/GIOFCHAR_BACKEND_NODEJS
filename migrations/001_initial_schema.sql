-- Migration: 001_initial_schema.sql
-- Description: Create initial schema for Giofchar Express SQL Backend

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `userName` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` CHAR(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` ENUM('user','admin') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `isActive` TINYINT(1) DEFAULT '1',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `categoryName` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoryDescription` MEDIUMTEXT COLLATE utf8mb4_unicode_ci,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categoryName` (`categoryName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `foods` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `foodName` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `foodDescription` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `ingredients` JSON DEFAULT NULL,
  `originalPrice` DECIMAL(10,2) DEFAULT NULL,
  `price` DECIMAL(10,2) DEFAULT NULL,
  `discount` INT(11) DEFAULT '0',
  `rating` INT(11) DEFAULT '0',
  `stock` INT(11) DEFAULT '0',
  `isActive` TINYINT(1) NOT NULL DEFAULT '1',
  `categoryID` INT(11) NOT NULL,
  `image` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagePublicId` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `foodName` (`foodName`),
  KEY `fk_foods_category` (`categoryID`),
  CONSTRAINT `fk_foods_category` FOREIGN KEY (`categoryID`) REFERENCES `categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `food_variants` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `foodID` INT(11) NOT NULL,
  `weight_gram` INT(11) NOT NULL,
  `originalPrice` INT(11) NOT NULL,
  `stock` INT(11) NOT NULL DEFAULT '0',
  `isActive` TINYINT(1) DEFAULT '1',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_food_weight` (`foodID`,`weight_gram`),
  CONSTRAINT `fk_food_variant` FOREIGN KEY (`foodID`) REFERENCES `foods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `carts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `userID` INT(11) DEFAULT NULL,
  `guestToken` CHAR(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cartVersion` INT(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_cart` (`userID`),
  UNIQUE KEY `uniq_guest_cart` (`guestToken`),
  KEY `idx_cart_guest` (`guestToken`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `cartID` INT(11) NOT NULL,
  `foodID` INT(11) DEFAULT NULL,
  `quantity` INT(11) NOT NULL DEFAULT '1',
  `weight` INT(11) DEFAULT NULL,
  `food_variantID` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_cart_foodVariant` (`cartID`,`food_variantID`),
  KEY `fk_ci_food_variant` (`food_variantID`),
  KEY `cart_items_ibfk_2` (`foodID`),
  KEY `idx_cart_items_cartID` (`cartID`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cartID`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ci_food_variant` FOREIGN KEY (`food_variantID`) REFERENCES `food_variants` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promotions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` ENUM('PERCENT','FIXED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` INT(11) NOT NULL,
  `start_at` DATETIME NOT NULL,
  `end_at` DATETIME NOT NULL,
  `isActive` TINYINT(1) DEFAULT '1',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promotion_targets` (
  `promotionID` INT(11) NOT NULL,
  `food_variantID` INT(11) NOT NULL,
  PRIMARY KEY (`promotionID`,`food_variantID`),
  UNIQUE KEY `uniq_foodVariant` (`food_variantID`),
  CONSTRAINT `fk_promotion_targets_promotion` FOREIGN KEY (`promotionID`) REFERENCES `promotions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_promotion_targets_variant` FOREIGN KEY (`food_variantID`) REFERENCES `food_variants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `orderCode` VARCHAR(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userID` INT(11) DEFAULT NULL,
  `guestToken` CHAR(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` ENUM('delivering','unconfirmed','cancelled','delivered') COLLATE utf8mb4_unicode_ci DEFAULT 'unconfirmed',
  `paymentStatus` ENUM('success','failed','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `customerName` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` CHAR(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `has_viewed_payment_result` TINYINT(1) DEFAULT '0',
  `payment_result_viewed_at` TIMESTAMP NULL DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orderCode` (`orderCode`),
  KEY `fk_orders_user` (`userID`),
  KEY `idx_order_guest` (`guestToken`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `orderID` INT(11) NOT NULL,
  `foodID` INT(11) DEFAULT NULL,
  `quantity` INT(11) DEFAULT '1',
  `unitPrice` DECIMAL(10,2) DEFAULT NULL,
  `totalPrice` DECIMAL(10,2) NOT NULL,
  `food_variantID` INT(11) NOT NULL,
  `item_name` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight_gram` INT(11) NOT NULL,
  `originalPrice` INT(11) NOT NULL,
  `discount_type` ENUM('FIXED','PERCENT') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_value` INT(11) DEFAULT NULL,
  `discount_amount` INT(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order_foodVariant` (`orderID`,`food_variantID`),
  KEY `fk_order_items_food` (`foodID`),
  KEY `fk_oi_food_variant` (`food_variantID`),
  CONSTRAINT `fk_oi_food_variant` FOREIGN KEY (`food_variantID`) REFERENCES `food_variants` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_food` FOREIGN KEY (`foodID`) REFERENCES `foods` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`orderID`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `orderID` INT(11) DEFAULT NULL,
  `paymentType` ENUM('COD','CARD') COLLATE utf8mb4_unicode_ci DEFAULT 'COD',
  `provider` ENUM('vnpay') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `transactionID` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` ENUM('success','failed','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orderID` (`orderID`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`orderID`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `userID` INT(11) NOT NULL,
  `tokenHash` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked` TINYINT(1) DEFAULT '0',
  `expiresAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_refresh_token` (`tokenHash`),
  KEY `fk_resfreshTokens_users` (`userID`),
  CONSTRAINT `fk_resfreshTokens_users` FOREIGN KEY (`userID`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
