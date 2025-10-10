import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { executeQuery } from '../config/db.js';
import { config } from '../config/env.js';
import { validateImage, createThumbnail } from '../services/imageUtils.js';

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.uploadDir);
  },
  filename: (req, file, cb) => {
    const randomId = crypto.randomBytes(16).toString('hex');
    const uniqueName = `${randomId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${config.upload.allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1
  }
});

// Multer error handler middleware
const handleMulterError = (error, req, res, next) => {
  console.log('Multer error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `File size must be less than ${config.upload.maxFileSize / (1024 * 1024)}MB`
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Invalid field name',
        message: 'Please use "image" as the field name'
      });
    }
  }
  if (error.message.includes('File type') && error.message.includes('not allowed')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }
  return res.status(500).json({
    error: 'Upload error',
    message: error.message || 'An error occurred during file upload'
  });
};

// POST /api/upload/interior - Upload interior image
router.post('/interior', upload.single('image'), handleMulterError, async (req, res) => {
  try {
    console.log('Interior upload request received:', {
      file: req.file ? 'File present' : 'No file',
      body: req.body,
      headers: req.headers['content-type']
    });

    if (!req.file) {
      console.log('Error: No file uploaded');
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select an interior image file to upload'
      });
    }

    let { userId, storefrontDesignId, uploadType } = req.body;
    
    // Handle case where userId might be an array (from multiple form appends)
    if (Array.isArray(userId)) {
      // Find the first valid (non-undefined, non-null) userId
      userId = userId.find(id => id && id !== 'undefined' && id !== 'null') || userId[userId.length - 1];
    }
    
    console.log('Interior upload data:', { userId, storefrontDesignId, uploadType });
    console.log('Processed userId:', userId, typeof userId);
    
    if (!userId || userId === 'undefined' || userId === 'null' || !storefrontDesignId) {
      console.log('Error: Missing required fields', { userId, storefrontDesignId });
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID and storefront design ID are required'
      });
    }

    // Validate the uploaded image
    const isValidImage = await validateImage(req.file.path);
    if (!isValidImage) {
      return res.status(400).json({
        error: 'Invalid image',
        message: 'The uploaded file is not a valid image'
      });
    }

    // Verify the storefront design belongs to the user
    const storefrontCheck = await executeQuery(`
      SELECT gd.id, gd.user_id, u.id as upload_id
      FROM generated_designs gd 
      JOIN uploads u ON gd.upload_id = u.id
      WHERE gd.id = ? AND gd.user_id = ?
    `, [storefrontDesignId, userId]);

    if (storefrontCheck.length === 0) {
      return res.status(403).json({
        error: 'Invalid storefront design',
        message: 'Storefront design not found or does not belong to user'
      });
    }

    // Save interior upload record to database with reference to storefront
    console.log('Saving interior upload to database with user_id:', userId);
    const uploadResult = await executeQuery(`
      INSERT INTO uploads (user_id, original_name, filename, file_path, file_size, mime_type, upload_type, storefront_design_id)
      VALUES (?, ?, ?, ?, ?, ?, 'interior', ?)
    `, [
      userId,
      req.file.originalname,
      req.file.filename,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      storefrontDesignId
    ]);

    const uploadId = uploadResult.insertId;
    console.log('Interior upload saved successfully with ID:', uploadId);

    // Create thumbnail for faster loading
    const thumbnailPath = await createThumbnail(req.file.path, req.file.filename);

    res.json({
      success: true,
      message: 'Interior image uploaded successfully',
      data: {
        uploadId,
        userId: userId,
        storefrontDesignId: storefrontDesignId,
        originalName: req.file.originalname,
        filename: req.file.filename,
        filePath: `/uploads/${req.file.filename}`,
        thumbnailPath: thumbnailPath ? `/uploads/thumbnails/${path.basename(thumbnailPath)}` : null,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadType: 'interior',
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Interior upload error:', error);
    res.status(500).json({
      error: 'Interior upload failed',
      message: error.message || 'An error occurred while uploading the interior image'
    });
  }
});

// POST /api/upload - Upload shop facade image
router.post('/', upload.single('image'), handleMulterError, async (req, res) => {
  try {
    console.log('Upload request received:', {
      file: req.file ? 'File present' : 'No file',
      body: req.body,
      headers: req.headers['content-type']
    });

    if (!req.file) {
      console.log('Error: No file uploaded');
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select an image file to upload'
      });
    }

    const { userId, userInfo } = req.body;
    
    console.log('Request data:', { userId, userInfo: userInfo ? 'Present' : 'Not present' });
    
    // userId can be null, temporary, or a real database ID - we'll handle all cases

    // Validate the uploaded image
    const isValidImage = await validateImage(req.file.path);
    if (!isValidImage) {
      return res.status(400).json({
        error: 'Invalid image',
        message: 'The uploaded file is not a valid image'
      });
    }

    // Handle user creation/update logic
    let dbUserId = null;
    
    // First check if userId is a valid database ID (integer)
    if (userId && !isNaN(userId) && !userId.toString().startsWith('temp_')) {
      // Valid database user ID
      dbUserId = parseInt(userId);
      console.log('Using existing database user ID:', dbUserId);
    }
    
    // Process user info if provided
    if (userInfo && userInfo !== 'undefined') {
      const parsedUserInfo = typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo;
      console.log('Processing user info:', parsedUserInfo);
      
      if (parsedUserInfo.sapCode) {
        // Check if user exists by sap_code (unique identifier)
        const existingUser = await executeQuery(`
          SELECT id FROM users WHERE sap_code = ? LIMIT 1
        `, [parsedUserInfo.sapCode]);
        
        if (existingUser.length > 0) {
          dbUserId = existingUser[0].id;
          console.log('Found existing user by SAP code:', dbUserId);
          
          // Update existing user
          await executeQuery(`
            UPDATE users SET 
            dealership_name = ?, 
            mobile_number = ?, 
            updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [
            parsedUserInfo.dealershipName || null,
            parsedUserInfo.mobileNumber || null,
            dbUserId
          ]);
        } else {
          // Create new user
          const result = await executeQuery(`
            INSERT INTO users (dealership_name, sap_code, mobile_number) 
            VALUES (?, ?, ?)
          `, [
            parsedUserInfo.dealershipName || null,
            parsedUserInfo.sapCode || null,
            parsedUserInfo.mobileNumber || null
          ]);
          dbUserId = result.insertId;
          console.log('Created new user with ID:', dbUserId);
        }
      }
    }

    // Save upload record to database
    console.log('Saving upload to database with user_id:', dbUserId);
    const uploadResult = await executeQuery(`
      INSERT INTO uploads (user_id, original_name, filename, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      dbUserId, // This can be null, which is fine
      req.file.originalname,
      req.file.filename,
      req.file.path,
      req.file.size,
      req.file.mimetype
    ]);

    const uploadId = uploadResult.insertId;
    console.log('Upload saved successfully with ID:', uploadId);

    // Create thumbnail for faster loading
    const thumbnailPath = await createThumbnail(req.file.path, req.file.filename);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        uploadId,
        userId: dbUserId, // Return the database user ID (integer) or null
        originalName: req.file.originalname,
        filename: req.file.filename,
        filePath: `/uploads/${req.file.filename}`,
        thumbnailPath: thumbnailPath ? `/uploads/thumbnails/${path.basename(thumbnailPath)}` : null,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message || 'An error occurred while uploading the image'
    });
  }
});

// GET /api/upload/test - Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Upload API is working',
    timestamp: new Date().toISOString()
  });
});

// GET /api/upload/:userId - Get user's uploads
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const uploads = await executeQuery(`
      SELECT 
        u.id as upload_id,
        u.original_name,
        u.filename,
        u.file_path,
        u.file_size,
        u.mime_type,
        u.created_at,
        usr.dealership_name as user_dealership_name,
        usr.sap_code as user_sap_code
      FROM uploads u
      LEFT JOIN users usr ON u.user_id = usr.id
      WHERE u.user_id = ?
      ORDER BY u.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: uploads.map(upload => ({
        uploadId: upload.upload_id,
        originalName: upload.original_name,
        filename: upload.filename,
        filePath: `/uploads/${upload.filename}`,
        fileSize: upload.file_size,
        mimeType: upload.mime_type,
        uploadedAt: upload.created_at,
        userDealershipName: upload.user_dealership_name,
        userSapCode: upload.user_sap_code
      }))
    });

  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({
      error: 'Failed to fetch uploads',
      message: error.message
    });
  }
});

// DELETE /api/upload/:uploadId - Delete an upload
router.delete('/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing user ID',
        message: 'User ID is required to delete upload'
      });
    }

    // Verify ownership
    const upload = await executeQuery(`
      SELECT * FROM uploads WHERE id = ? AND user_id = ?
    `, [uploadId, userId]);

    if (upload.length === 0) {
      return res.status(404).json({
        error: 'Upload not found',
        message: 'Upload not found or you do not have permission to delete it'
      });
    }

    // Delete from database (cascade will handle related records)
    await executeQuery('DELETE FROM uploads WHERE id = ?', [uploadId]);

    // TODO: Delete physical files from filesystem
    // This would require fs operations to clean up files

    res.json({
      success: true,
      message: 'Upload deleted successfully'
    });

  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({
      error: 'Failed to delete upload',
      message: error.message
    });
  }
});

export default router;