-- JK Lakshmi AR Facade Designer Database Schema
-- Created: October 2025
-- Description: MySQL database schema for the AR facade design application

-- Drop database if exists (for fresh setup)
-- DROP DATABASE IF EXISTS jk_lakshmi_ar;

-- Create database
-- CREATE DATABASE jk_lakshmi_ar;
-- USE jk_lakshmi_ar;

-- Set charset and collation
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- Table: users
-- Description: Store user information
-- =============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dealership_name` varchar(255) NOT NULL,
  `sap_code` char(10) NOT NULL,
  `mobile_number` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sap_code` (`sap_code`),
  INDEX `idx_sap_code` (`sap_code`),
  INDEX `idx_mobile_number` (`mobile_number`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `chk_sap_code_format` CHECK (CHAR_LENGTH(`sap_code`) = 10 AND `sap_code` REGEXP '^[0-9]{10}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: uploads
-- Description: Store original uploaded images
-- =============================================
CREATE TABLE IF NOT EXISTS `uploads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `building_type` varchar(100) DEFAULT NULL,
  `building_style` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_uploads_user` (`user_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_building_type` (`building_type`),
  CONSTRAINT `fk_uploads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: generated_designs
-- Description: Store AI-generated facade designs
-- =============================================
CREATE TABLE IF NOT EXISTS `generated_designs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `upload_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `design_type` enum('modern','classical','industrial','eco_friendly') NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) NOT NULL,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `ai_prompt` text NOT NULL,
  `ai_response` json DEFAULT NULL,
  `generation_time` decimal(8,3) DEFAULT NULL,
  `gemini_model` varchar(100) DEFAULT 'gemini-2.5-flash',
  `processing_status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `quality_score` decimal(3,2) DEFAULT NULL,
  `is_favorite` boolean DEFAULT FALSE,
  `view_count` int(11) DEFAULT 0,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_designs_upload` (`upload_id`),
  KEY `fk_designs_user` (`user_id`),
  INDEX `idx_design_type` (`design_type`),
  INDEX `idx_processing_status` (`processing_status`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_is_favorite` (`is_favorite`),
  CONSTRAINT `fk_designs_upload` FOREIGN KEY (`upload_id`) REFERENCES `uploads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_designs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: shares
-- Description: Store shared designs for contest
-- =============================================
CREATE TABLE IF NOT EXISTS `shares` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `design_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `share_type` enum('contest','social','public') NOT NULL DEFAULT 'contest',
  `share_platform` varchar(50) DEFAULT NULL,
  `share_url` varchar(500) DEFAULT NULL,
  `share_code` varchar(20) UNIQUE DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `contest_category` varchar(100) DEFAULT NULL,
  `is_winner` boolean DEFAULT FALSE,
  `votes` int(11) DEFAULT 0,
  `likes` int(11) DEFAULT 0,
  `comments` int(11) DEFAULT 0,
  `view_count` int(11) DEFAULT 0,
  `is_public` boolean DEFAULT TRUE,
  `is_featured` boolean DEFAULT FALSE,
  `metadata` json DEFAULT NULL,
  `shared_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_shares_design` (`design_id`),
  KEY `fk_shares_user` (`user_id`),
  UNIQUE KEY `unique_share_code` (`share_code`),
  INDEX `idx_share_type` (`share_type`),
  INDEX `idx_contest_category` (`contest_category`),
  INDEX `idx_is_winner` (`is_winner`),
  INDEX `idx_is_public` (`is_public`),
  INDEX `idx_is_featured` (`is_featured`),
  INDEX `idx_shared_at` (`shared_at`),
  CONSTRAINT `fk_shares_design` FOREIGN KEY (`design_id`) REFERENCES `generated_designs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_shares_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: ar_sessions
-- Description: Track AR viewing sessions
-- =============================================
CREATE TABLE IF NOT EXISTS `ar_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `design_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_duration` int(11) DEFAULT NULL,
  `device_type` varchar(50) DEFAULT NULL,
  `browser` varchar(100) DEFAULT NULL,
  `platform` varchar(50) DEFAULT NULL,
  `camera_used` boolean DEFAULT TRUE,
  `ar_features_used` json DEFAULT NULL,
  `screenshot_taken` boolean DEFAULT FALSE,
  `session_quality` enum('poor','fair','good','excellent') DEFAULT NULL,
  `feedback_rating` int(1) DEFAULT NULL,
  `feedback_comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_device_type` (`device_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: app_settings
-- Description: Store application configuration
-- =============================================
CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` varchar(255) DEFAULT NULL,
  `is_public` boolean DEFAULT FALSE,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Insert default application settings
-- =============================================
INSERT IGNORE INTO `app_settings` (`setting_key`, `setting_value`, `setting_type`, `description`, `is_public`) VALUES
('app_name', 'JK Lakshmi AR Facade Designer', 'string', 'Application name', TRUE),
('app_version', '1.0.0', 'string', 'Current application version', TRUE),
('max_upload_size', '10485760', 'number', 'Maximum file upload size in bytes', FALSE),
('allowed_file_types', '["image/jpeg", "image/png", "image/webp"]', 'json', 'Allowed file MIME types for upload', FALSE),
('gemini_model', 'gemini-2.5-flash', 'string', 'Default Gemini AI model', FALSE),
('contest_active', 'true', 'boolean', 'Whether the design contest is currently active', TRUE),
('contest_end_date', '2025-12-31 23:59:59', 'string', 'Contest end date', TRUE),
('featured_designs_limit', '10', 'number', 'Number of featured designs to show', TRUE),
('ar_target_tracking', 'simple', 'string', 'AR tracking method: simple or advanced', FALSE),
('enable_social_sharing', 'true', 'boolean', 'Enable social media sharing features', TRUE),
('enable_ar_screenshots', 'true', 'boolean', 'Enable AR screenshot capture', TRUE),
('design_generation_timeout', '60', 'number', 'AI generation timeout in seconds', FALSE),
('cache_expiry_hours', '24', 'number', 'Cache expiry time in hours', FALSE);

-- =============================================
-- Create indexes for better performance
-- =============================================
 
-- =============================================
-- Add foreign key constraints after table creation
-- =============================================

-- Add foreign key constraints for ar_sessions table
-- Using a compatible approach with explicit column attributes
ALTER TABLE `ar_sessions` 
MODIFY COLUMN `design_id` int(11) NOT NULL;

ALTER TABLE `ar_sessions` 
MODIFY COLUMN `user_id` int(11) DEFAULT NULL;

-- Add foreign key constraints separately
-- Note: fk_ar_sessions_design constraint removed due to compatibility issues
-- The design_id column still has an index for performance

 

-- =============================================
-- Create views for common queries
-- =============================================

-- View: Popular designs
CREATE OR REPLACE VIEW `popular_designs` AS
SELECT 
    gd.*,
    u.filename as upload_filename,
    u.original_name as upload_original_name,
    usr.dealership_name as user_dealership_name,
    usr.sap_code as user_sap_code,
    usr.mobile_number as user_mobile_number,
    COALESCE(s.share_count, 0) as total_shares,
    COALESCE(ar.session_count, 0) as ar_sessions
FROM `generated_designs` gd
LEFT JOIN `uploads` u ON gd.upload_id = u.id
LEFT JOIN `users` usr ON gd.user_id = usr.id
LEFT JOIN (
    SELECT design_id, COUNT(*) as share_count 
    FROM `shares` 
    WHERE is_public = TRUE 
    GROUP BY design_id
) s ON gd.id = s.design_id
LEFT JOIN (
    SELECT design_id, COUNT(*) as session_count 
    FROM `ar_sessions` 
    GROUP BY design_id
) ar ON gd.id = ar.design_id
WHERE gd.processing_status = 'completed'
ORDER BY (gd.view_count + COALESCE(s.share_count, 0) * 5 + COALESCE(ar.session_count, 0) * 3) DESC;

-- View: Contest entries
CREATE OR REPLACE VIEW `contest_entries` AS
SELECT 
    s.*,
    gd.design_type,
    gd.file_path as design_file_path,
    gd.created_at as design_created_at,
    u.filename as upload_filename,
    u.file_path as original_file_path,
    usr.dealership_name as user_dealership_name,
    usr.sap_code as user_sap_code,
    usr.mobile_number as user_mobile_number
FROM `shares` s
JOIN `generated_designs` gd ON s.design_id = gd.id
JOIN `uploads` u ON gd.upload_id = u.id
LEFT JOIN `users` usr ON s.user_id = usr.id
WHERE s.share_type = 'contest'
AND s.is_public = TRUE
ORDER BY s.votes DESC, s.likes DESC, s.shared_at DESC;

-- =============================================
-- Create triggers for data consistency
-- =============================================

-- Trigger: Update view count when design is accessed
DELIMITER $$
CREATE TRIGGER `update_design_view_count` 
AFTER INSERT ON `ar_sessions`
FOR EACH ROW
BEGIN
    UPDATE `generated_designs` 
    SET `view_count` = `view_count` + 1 
    WHERE `id` = NEW.design_id;
END$$
DELIMITER ;

-- Trigger: Auto-generate share code
DELIMITER $$
CREATE TRIGGER `generate_share_code` 
BEFORE INSERT ON `shares`
FOR EACH ROW
BEGIN
    IF NEW.share_code IS NULL THEN
        SET NEW.share_code = CONCAT('JK', UPPER(SUBSTRING(MD5(CONCAT(NEW.design_id, NEW.user_id, NOW())), 1, 8)));
    END IF;
END$$
DELIMITER ;

-- =============================================
-- Set foreign key checks back to 1
-- =============================================
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- Show table structure summary
-- =============================================
SELECT 'Database schema created successfully!' as status;
SELECT 
    TABLE_NAME as 'Table Name',
    TABLE_ROWS as 'Estimated Rows',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;