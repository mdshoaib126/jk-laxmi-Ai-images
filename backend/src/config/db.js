import mysql from 'mysql2/promise';
import { config } from './env.js';

let pool;

export const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: config.database.connectionLimit,
      queueLimit: 0,
      acquireTimeout: config.database.acquireTimeout,
      timeout: config.database.timeout,
    });
  }
  return pool;
};

export const getConnection = async () => {
  const pool = createPool();
  return await pool.getConnection();
};

export const executeQuery = async (query, params = []) => {
  const pool = createPool();
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const initializeDatabase = async () => {
  const pool = createPool();
  
  try {
    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
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
      CREATE TABLE IF NOT EXISTS uploads (
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
      CREATE TABLE IF NOT EXISTS generated_designs (
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
      CREATE TABLE IF NOT EXISTS shares (
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

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (pool) {
    await pool.end();
    console.log('Database pool closed');
  }
  process.exit(0);
});