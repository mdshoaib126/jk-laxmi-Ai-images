DELIMITER $$ 
CREATE TRIGGER `generate_share_code` 
BEFORE INSERT ON `shares` 
FOR EACH ROW BEGIN 
IF NEW.share_code IS NULL THEN
        SET NEW.share_code = CONCAT('JK', UPPER(SUBSTRING(MD5(CONCAT(NEW.design_id, NEW.user_id, NOW())), 1, 8)));
    END IF; 
END$$ 
DELIMITER; 
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database schema created successfully!' as status;
SELECT 
    TABLE_NAME as 'Table Name',
    TABLE_ROWS as 'Estimated Rows',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME;