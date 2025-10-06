import { createPool } from '../config/db.js';

const resetDatabase = async () => {
  const pool = createPool();
  
  try {
    console.log('🔄 Resetting database schema...');
    
    // Drop existing tables in correct order (due to foreign keys)
    await pool.execute('DROP TABLE IF EXISTS ar_sessions');
    await pool.execute('DROP TABLE IF EXISTS shares');
    await pool.execute('DROP TABLE IF EXISTS generated_designs');  
    await pool.execute('DROP TABLE IF EXISTS uploads');
    await pool.execute('DROP TABLE IF EXISTS users');
    
    console.log('✅ Dropped existing tables');
    
    // Create users table
    await pool.execute(`
      CREATE TABLE users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(20),
        shop_name VARCHAR(255),
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create uploads table
    await pool.execute(`
      CREATE TABLE uploads (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        original_filename VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create generated_designs table
    await pool.execute(`
      CREATE TABLE generated_designs (
        id VARCHAR(36) PRIMARY KEY,
        upload_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        design_type ENUM('modern_premium', 'trust_heritage', 'eco_smart', 'festive') NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        ai_prompt TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        INDEX idx_upload_id (upload_id),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create shares table for contest tracking
    await pool.execute(`
      CREATE TABLE shares (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        design_id VARCHAR(36) NOT NULL,
        share_platform VARCHAR(50),
        share_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        contest_entry BOOLEAN DEFAULT TRUE,
        INDEX idx_user_id (user_id),
        INDEX idx_design_id (design_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (design_id) REFERENCES generated_designs(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Created new tables with updated schema');
    console.log('🎉 Database reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Database reset error:', error);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
};

resetDatabase().catch(console.error);