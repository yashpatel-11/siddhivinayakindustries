-- MySQL Schema for Siddhivinayak CNC Workshop Stock & Challan Management System
-- Database: siddhivinayak_cnc

CREATE DATABASE IF NOT EXISTS `siddhivinayak_cnc` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `siddhivinayak_cnc`;

-- 1. Parties (Customers / Material Suppliers / Jobwork Providers)
CREATE TABLE IF NOT EXISTS `parties` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `gstin` VARCHAR(20) DEFAULT NULL,
    `address` TEXT DEFAULT NULL,
    `phone` VARCHAR(100) DEFAULT NULL,
    `state_code` VARCHAR(50) DEFAULT '24-Gujarat',
    `workshop` VARCHAR(50) DEFAULT 'siddhivinayak',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_party_name` (`name`),
    INDEX `idx_party_workshop` (`workshop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Parts / Components Master
CREATE TABLE IF NOT EXISTS `parts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `part_no` VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(255) NOT NULL,
    `grade` VARCHAR(100) DEFAULT NULL,
    `hsn_code` VARCHAR(20) DEFAULT '73261910',
    `default_rate` DECIMAL(10, 2) DEFAULT 0.00,
    `unit` VARCHAR(20) DEFAULT 'NOS',
    `workshop` VARCHAR(50) DEFAULT 'siddhivinayak',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_part_no` (`part_no`),
    INDEX `idx_part_workshop` (`workshop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Inward Challans (Jobwork Inward Documents)
CREATE TABLE IF NOT EXISTS `inward_challans` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `challan_no` VARCHAR(100) NOT NULL,
    `challan_date` DATE NOT NULL,
    `party_id` INT NOT NULL,
    `vehicle_no` VARCHAR(50) DEFAULT NULL,
    `eway_bill_no` VARCHAR(50) DEFAULT NULL,
    `process_required` VARCHAR(255) DEFAULT 'BROACHING / CNC TURNING',
    `remarks` TEXT DEFAULT NULL,
    `workshop` VARCHAR(50) DEFAULT 'siddhivinayak',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON DELETE CASCADE,
    INDEX `idx_inward_party_date` (`party_id`, `challan_date`),
    INDEX `idx_inward_challan_no` (`challan_no`),
    INDEX `idx_inward_workshop` (`workshop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Inward Challan Line Items
CREATE TABLE IF NOT EXISTS `inward_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `inward_id` INT NOT NULL,
    `part_id` INT NOT NULL,
    `grade` VARCHAR(100) DEFAULT NULL,
    `heat_no` VARCHAR(100) DEFAULT NULL,
    `quantity` DECIMAL(12, 3) NOT NULL,
    `rate` DECIMAL(10, 2) DEFAULT 0.00,
    `amount` DECIMAL(14, 2) DEFAULT 0.00,
    FOREIGN KEY (`inward_id`) REFERENCES `inward_challans`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON DELETE RESTRICT,
    INDEX `idx_inward_items_part` (`part_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Outward Challans (Jobwork Outward / Dispatch Documents)
CREATE TABLE IF NOT EXISTS `outward_challans` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `challan_no` VARCHAR(100) NOT NULL,
    `challan_date` DATE NOT NULL,
    `party_id` INT NOT NULL,
    `vehicle_no` VARCHAR(50) DEFAULT NULL,
    `eway_bill_no` VARCHAR(50) DEFAULT NULL,
    `process_carried_out` VARCHAR(255) DEFAULT 'CNC TURNING',
    `remarks` TEXT DEFAULT NULL,
    `workshop` VARCHAR(50) DEFAULT 'siddhivinayak',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON DELETE CASCADE,
    INDEX `idx_outward_party_date` (`party_id`, `challan_date`),
    INDEX `idx_outward_challan_no` (`challan_no`),
    INDEX `idx_outward_workshop` (`workshop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Outward Challan Line Items
CREATE TABLE IF NOT EXISTS `outward_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `outward_id` INT NOT NULL,
    `part_id` INT NOT NULL,
    `inward_item_id` INT DEFAULT NULL,
    `inward_challan_no` VARCHAR(100) DEFAULT NULL,
    `heat_no` VARCHAR(100) DEFAULT NULL,
    `quantity` DECIMAL(12, 3) NOT NULL,
    `machine_rejection` DECIMAL(12, 3) DEFAULT 0.00,
    `forging_rejection` DECIMAL(12, 3) DEFAULT 0.00,
    `waste_quantity` DECIMAL(12, 3) DEFAULT 0.00,
    `rate` DECIMAL(10, 2) DEFAULT 0.00,
    `amount` DECIMAL(14, 2) DEFAULT 0.00,
    FOREIGN KEY (`outward_id`) REFERENCES `outward_challans`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON DELETE RESTRICT,
    INDEX `idx_outward_items_part` (`part_id`),
    INDEX `idx_outward_inward_item` (`inward_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Seed Data (Based on CNC Workshop Real Challan)
INSERT INTO `parties` (`id`, `name`, `gstin`, `address`, `phone`, `state_code`, `workshop`) VALUES
(1, 'AJK FORGE PRIVATE LIMITED', '24AAGCA0436P1ZN', 'PLOT NO. 10 A SURVEY NO. 197 NEAR: MICROMELT PVT.LTD.VERAVAL (SHAPAR), RAJKOT.', '9427867368 / 9313546921', '24-Gujarat', 'siddhivinayak'),
(2, 'MARUTI AUTO COMPONENTS', '24AAECM4189B1Z2', 'GIDC PHASE II, PLOT NO. 45/A, METODA, RAJKOT - 360021', '9825012345', '24-Gujarat', 'siddhivinayak'),
(3, 'SHREE RAM PRECISION TECH', '24AABCS8891D1ZO', 'SHED NO. 8, SAMRAT INDUSTRIAL AREA, GONDAL ROAD, RAJKOT', '9724156789', '24-Gujarat', 'siddhivinayak'),
(4, 'METALIC TECHNOFORGE LIMITED', '24AAKCM6128N1Z2', 'PLOT NO. 6, SURVEY NOS. 296, PADAVALA, TAL KOTADASANGANI - 360,024', '9825000000 / 9979000000', '24-Gujarat', 'gayatri')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `workshop`=VALUES(`workshop`);

INSERT INTO `parts` (`id`, `part_no`, `description`, `grade`, `hsn_code`, `default_rate`, `unit`, `workshop`) VALUES
(1, 'SG2639BRMC', 'Gear Shaft Machined Component', '20MNCR5', '73261910', 82.00, 'NOS', 'siddhivinayak'),
(2, 'FL-4401-PIN', 'Flange Pinion Pin Bush', 'EN8D', '84834000', 45.00, 'NOS', 'siddhivinayak'),
(3, 'HUB-982-FR', 'Front Hub Precision Spindle', 'EN19', '87082900', 120.00, 'NOS', 'siddhivinayak'),
(4, 'VL-ROD-32', 'Connecting Valve Rod', 'SS304', '73269099', 65.50, 'NOS', 'siddhivinayak'),
(5, 'MF4138', 'GEAR', '20MOCR4', 'B1581', 0.00, 'NOS', 'gayatri')
ON DUPLICATE KEY UPDATE `part_no`=VALUES(`part_no`), `workshop`=VALUES(`workshop`);


