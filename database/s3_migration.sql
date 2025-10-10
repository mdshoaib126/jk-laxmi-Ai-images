ALTER TABLE uploads ADD COLUMN s3_key VARCHAR(500) NULL AFTER file_path;
ALTER TABLE uploads ADD COLUMN s3_url VARCHAR(1000) NULL AFTER s3_key;
ALTER TABLE uploads ADD COLUMN thumbnail_s3_key VARCHAR(500) NULL AFTER s3_url;
ALTER TABLE uploads ADD COLUMN thumbnail_s3_url VARCHAR(1000) NULL AFTER thumbnail_s3_key;
ALTER TABLE generated_designs ADD COLUMN s3_key VARCHAR(500) NULL AFTER file_path;
ALTER TABLE generated_designs ADD COLUMN s3_url VARCHAR(1000) NULL AFTER s3_key;
CREATE INDEX idx_uploads_s3_key ON uploads (s3_key);
CREATE INDEX idx_designs_s3_key ON generated_designs (s3_key);