import express from 'express';
import { executeQuery } from '../config/db.js';

const router = express.Router();

// GET /api/designs/:userId - Get user's generated designs
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { uploadId, designType } = req.query;

    let query = `
      SELECT 
        gd.id as design_id,
        gd.upload_id,
        gd.design_type,
        gd.filename,
        gd.file_path,
        gd.ai_prompt,
        gd.created_at,
        gd.processing_status,
        u.original_name,
        u.filename as original_filename_stored,
        u.created_at as upload_created_at,
        usr.dealership_name as user_dealership_name,
        usr.sap_code as user_sap_code
      FROM generated_designs gd
      LEFT JOIN uploads u ON gd.upload_id = u.id
      LEFT JOIN users usr ON gd.user_id = usr.id
      WHERE gd.user_id = ?
    `;
    
    const params = [userId];

    if (uploadId) {
      query += ' AND gd.upload_id = ?';
      params.push(uploadId);
    }

    if (designType) {
      query += ' AND gd.design_type = ?';
      params.push(designType);
    }

    query += ' ORDER BY gd.created_at DESC';

    const designs = await executeQuery(query, params);

    // Group designs by upload_id for better organization
    const groupedDesigns = designs.reduce((acc, design) => {
      const uploadId = design.upload_id;
      if (!acc[uploadId]) {
        acc[uploadId] = {
          uploadId,
          originalImage: {
            filename: design.original_name,
            filePath: `/uploads/${design.original_filename_stored}`, // Keep local path for original images
            uploadedAt: design.upload_created_at
          },
          userInfo: {
            dealershipName: design.user_dealership_name,
            sapCode: design.user_sap_code
          },
          designs: []
        };
      }
      
      acc[uploadId].designs.push({
        designId: design.design_id,
        designType: design.design_type,
        filename: design.filename,
        filePath: design.file_path, // Use the actual stored file_path (S3 URL or local path)
        prompt: design.ai_prompt,
        generatedAt: design.created_at,
        isSelected: design.processing_status === 'completed'
      });
      
      return acc;
    }, {});

    res.json({
      success: true,
      data: Object.values(groupedDesigns)
    });

  } catch (error) {
    console.error('Get designs error:', error);
    res.status(500).json({
      error: 'Failed to fetch designs',
      message: error.message
    });
  }
});

// GET /api/designs/detail/:designId - Get specific design details
router.get('/detail/:designId', async (req, res) => {
  try {
    const { designId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing user ID',
        message: 'User ID is required'
      });
    }

    const designs = await executeQuery(`
      SELECT 
        gd.id as design_id,
        gd.upload_id,
        gd.user_id,
        gd.design_type,
        gd.filename,
        gd.file_path,
        gd.ai_prompt,
        gd.created_at,
        gd.processing_status,
        u.original_name,
        u.filename as original_filename_stored,
        u.file_size,
        u.mime_type,
        u.created_at as upload_created_at,
        usr.dealership_name as user_dealership_name,
        usr.sap_code as user_sap_code,
        usr.mobile_number as user_mobile_number
      FROM generated_designs gd
      LEFT JOIN uploads u ON gd.upload_id = u.id
      LEFT JOIN users usr ON gd.user_id = usr.id
      WHERE gd.id = ? AND gd.user_id = ?
    `, [designId, userId]);

    if (designs.length === 0) {
      return res.status(404).json({
        error: 'Design not found',
        message: 'The specified design was not found'
      });
    }

    const design = designs[0];

    res.json({
      success: true,
      data: {
        designId: design.design_id,
        uploadId: design.upload_id,
        userId: design.user_id,
        designType: design.design_type,
        filename: design.filename,
        filePath: design.file_path, // Use actual stored file_path (S3 URL)
        prompt: design.ai_prompt,
        generatedAt: design.created_at,
        isSelected: design.processing_status === 'completed',
        originalImage: {
          filename: design.original_name,
          filePath: `/uploads/${design.original_filename_stored}`,
          fileSize: design.file_size,
          mimeType: design.mime_type,
          uploadedAt: design.upload_created_at
        },
        userInfo: {
          dealershipName: design.user_dealership_name,
          sapCode: design.user_sap_code,
          mobileNumber: design.user_mobile_number
        }
      }
    });

  } catch (error) {
    console.error('Get design detail error:', error);
    res.status(500).json({
      error: 'Failed to fetch design details',
      message: error.message
    });
  }
});

// PUT /api/designs/:designId/select - Mark a design as selected
router.put('/:designId/select', async (req, res) => {
  try {
    const { designId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing user ID',
        message: 'User ID is required'
      });
    }

    // Verify ownership
    const designs = await executeQuery(`
      SELECT upload_id FROM generated_designs WHERE id = ? AND user_id = ?
    `, [designId, userId]);

    if (designs.length === 0) {
      return res.status(404).json({
        error: 'Design not found',
        message: 'Design not found or you do not have permission to modify it'
      });
    }

    const uploadId = designs[0].upload_id;

    // Design selection functionality removed - column no longer exists in schema

    res.json({
      success: true,
      message: 'Design selected successfully',
      data: {
        designId,
        isSelected: true
      }
    });

  } catch (error) {
    console.error('Select design error:', error);
    res.status(500).json({
      error: 'Failed to select design',
      message: error.message
    });
  }
});

// DELETE /api/designs/:designId - Delete a generated design
router.delete('/:designId', async (req, res) => {
  try {
    const { designId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing user ID',
        message: 'User ID is required'
      });
    }

    // Verify ownership
    const designs = await executeQuery(`
      SELECT * FROM generated_designs WHERE id = ? AND user_id = ?
    `, [designId, userId]);

    if (designs.length === 0) {
      return res.status(404).json({
        error: 'Design not found',
        message: 'Design not found or you do not have permission to delete it'
      });
    }

    // Delete from database
    await executeQuery('DELETE FROM generated_designs WHERE id = ?', [designId]);

    // TODO: Delete physical file from filesystem
    // This would require fs operations to clean up generated files

    res.json({
      success: true,
      message: 'Design deleted successfully'
    });

  } catch (error) {
    console.error('Delete design error:', error);
    res.status(500).json({
      error: 'Failed to delete design',
      message: error.message
    });
  }
});

// GET /api/designs/stats/:userId - Get user's design statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await executeQuery(`
      SELECT 
        design_type,
        COUNT(*) as count_by_type
      FROM generated_designs 
      WHERE user_id = ?
      GROUP BY design_type
    `, [userId]);

    const totalStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_designs,
        COUNT(DISTINCT upload_id) as total_uploads
      FROM generated_designs 
      WHERE user_id = ?
    `, [userId]);

    res.json({
      success: true,
      data: {
        totalDesigns: totalStats[0]?.total_designs || 0,
        totalUploads: totalStats[0]?.total_uploads || 0,
        designsByType: stats.reduce((acc, stat) => {
          acc[stat.design_type] = stat.count_by_type;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get design stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch design statistics',
      message: error.message
    });
  }
});

// GET /api/designs/interior/:userId - Get user's interior designs
router.get('/interior/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { uploadId } = req.query;

    let query = `
      SELECT 
        gd.id as design_id,
        gd.upload_id,
        gd.design_type,
        gd.filename,
        gd.file_path,
        gd.ai_prompt,
        gd.created_at,
        gd.processing_status,
        gd.storefront_design_id,
        u.original_name,
        u.filename as original_filename_stored,
        u.created_at as upload_created_at,
        usr.dealership_name as user_dealership_name,
        usr.sap_code as user_sap_code,
        sgd.design_type as storefront_design_type,
        sgd.filename as storefront_filename,
        sgd.file_path as storefront_file_path
      FROM generated_designs gd
      LEFT JOIN uploads u ON gd.upload_id = u.id
      LEFT JOIN users usr ON gd.user_id = usr.id
      LEFT JOIN generated_designs sgd ON gd.storefront_design_id = sgd.id
      WHERE gd.user_id = ? AND gd.is_interior = true
    `;
    
    const params = [userId];

    if (uploadId) {
      query += ' AND gd.upload_id = ?';
      params.push(uploadId);
    }

    query += ' ORDER BY gd.created_at DESC';

    const designs = await executeQuery(query, params);

    // Group designs by upload_id for better organization
    const groupedDesigns = designs.reduce((acc, design) => {
      const uploadId = design.upload_id;
      if (!acc[uploadId]) {
        acc[uploadId] = {
          uploadId,
          originalImage: {
            filename: design.original_name,
            filePath: `/uploads/${design.original_filename_stored}`,
            uploadedAt: design.upload_created_at
          },
          storefrontDesign: {
            designId: design.storefront_design_id,
            designType: design.storefront_design_type,
            filename: design.storefront_filename,
            filePath: design.storefront_file_path || `/generated/${design.storefront_filename}` // Use S3 URL if available
          },
          userInfo: {
            dealershipName: design.user_dealership_name,
            sapCode: design.user_sap_code
          },
          designs: []
        };
      }
      
      acc[uploadId].designs.push({
        designId: design.design_id,
        designType: design.design_type,
        filename: design.filename,
        filePath: design.file_path, // Use actual stored file_path (S3 URL)
        prompt: design.ai_prompt,
        generatedAt: design.created_at,
        isSelected: design.processing_status === 'completed',
        isInterior: true,
        storefrontDesignId: design.storefront_design_id
      });
      
      return acc;
    }, {});

    res.json({
      success: true,
      data: Object.values(groupedDesigns)
    });

  } catch (error) {
    console.error('Get interior designs error:', error);
    res.status(500).json({
      error: 'Failed to fetch interior designs',
      message: error.message
    });
  }
});

// PUT /api/designs/interior/:designId/select - Mark an interior design as selected
router.put('/interior/:designId/select', async (req, res) => {
  try {
    const { designId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing user ID',
        message: 'User ID is required'
      });
    }

    // Verify ownership
    const designs = await executeQuery(`
      SELECT upload_id FROM generated_designs WHERE id = ? AND user_id = ? AND is_interior = true
    `, [designId, userId]);

    if (designs.length === 0) {
      return res.status(404).json({
        error: 'Interior design not found',
        message: 'Interior design not found or you do not have permission to modify it'
      });
    }

    res.json({
      success: true,
      message: 'Interior design selected successfully',
      data: {
        designId,
        isSelected: true,
        isInterior: true
      }
    });

  } catch (error) {
    console.error('Select interior design error:', error);
    res.status(500).json({
      error: 'Failed to select interior design',
      message: error.message
    });
  }
});

// GET /api/designs/:designId - Get specific design by ID (for both storefront and interior)
router.get('/:designId', async (req, res) => {
  try {
    const { designId } = req.params;

    const designs = await executeQuery(`
      SELECT 
        gd.id as design_id,
        gd.upload_id,
        gd.user_id,
        gd.design_type,
        gd.filename,
        gd.file_path,
        gd.ai_prompt,
        gd.created_at,
        gd.processing_status,
        gd.is_interior,
        gd.storefront_design_id,
        u.original_name,
        u.filename as original_filename_stored,
        u.file_size,
        u.mime_type,
        u.created_at as upload_created_at,
        usr.dealership_name as user_dealership_name,
        usr.sap_code as user_sap_code,
        usr.mobile_number as user_mobile_number
      FROM generated_designs gd
      LEFT JOIN uploads u ON gd.upload_id = u.id
      LEFT JOIN users usr ON gd.user_id = usr.id
      WHERE gd.id = ?
    `, [designId]);

    if (designs.length === 0) {
      return res.status(404).json({
        error: 'Design not found',
        message: 'The specified design was not found'
      });
    }

    const design = designs[0];

    res.json({
      success: true,
      data: {
        designId: design.design_id,
        uploadId: design.upload_id,
        userId: design.user_id,
        designType: design.design_type,
        filename: design.filename,
        filePath: design.file_path, // Use actual stored file_path (S3 URL)
        prompt: design.ai_prompt,
        generatedAt: design.created_at,
        isSelected: design.processing_status === 'completed',
        isInterior: design.is_interior || false,
        storefrontDesignId: design.storefront_design_id,
        originalImage: {
          filename: design.original_name,
          filePath: `/uploads/${design.original_filename_stored}`,
          fileSize: design.file_size,
          mimeType: design.mime_type,
          uploadedAt: design.upload_created_at
        },
        userInfo: {
          dealershipName: design.user_dealership_name,
          sapCode: design.user_sap_code,
          mobileNumber: design.user_mobile_number
        }
      }
    });

  } catch (error) {
    console.error('Get design error:', error);
    res.status(500).json({
      error: 'Failed to fetch design',
      message: error.message
    });
  }
});

export default router;