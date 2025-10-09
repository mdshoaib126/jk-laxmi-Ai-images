
ALTER TABLE `ar_sessions` MODIFY COLUMN `design_id` int(11) NOT NULL;

ALTER TABLE `ar_sessions` MODIFY COLUMN `user_id` int(11) DEFAULT NULL;
 
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
    WHERE `shares`.`is_public` = TRUE 
    GROUP BY design_id
) s ON gd.id = s.design_id
LEFT JOIN (
    SELECT design_id, COUNT(*) as session_count 
    FROM `ar_sessions` 
    GROUP BY design_id
) ar ON gd.id = ar.design_id
WHERE gd.processing_status = 'completed' ORDER BY (gd.view_count + COALESCE(s.share_count, 0) * 5 + COALESCE(ar.session_count, 0) * 3) DESC;

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
AND s.is_public = TRUE ORDER BY s.votes DESC, s.likes DESC, s.shared_at DESC;
 
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
AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME;