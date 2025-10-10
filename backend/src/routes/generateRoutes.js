import express from 'express';
import { executeQuery } from '../config/db.js';
import { generateFacadeDesigns, generateInteriorDesigns } from '../services/geminiService.js';
import { saveGeneratedImage } from '../services/imageUtils.js';
import { saveGeneratedImageToS3 } from '../utils/s3Upload.js';

const router = express.Router();

// POST /api/generate - Generate facade designs using Gemini AI
router.post('/', async (req, res) => {
  try {
    const { uploadId, userId, designTypes } = req.body;

    if (!uploadId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Upload ID and User ID are required'
      });
    }

    // Get the upload record
    console.log('Looking for upload with ID:', uploadId, 'and user ID:', userId);
    
    // Find upload by ID - userId matching will be handled during generation
    const uploads = await executeQuery(`
      SELECT * FROM uploads WHERE id = ?
    `, [uploadId]);

    console.log('Found uploads:', uploads.length);
    if (uploads.length === 0) {
      return res.status(404).json({
        error: 'Upload not found',
        message: 'The specified upload was not found'
      });
    }
    
    const upload = uploads[0];
    console.log('Using upload user_id for generated_designs:', upload.user_id);
    
    // Define design types if not provided
    const defaultTypes = [
      'modern_premium',
      'trust_heritage', 
      'eco_smart',
      'festive'
    ];
    const typesToGenerate = designTypes || defaultTypes;

    // Map frontend design types to database enum values
    const designTypeMap = {
      'modern_premium': 'modern',
      'trust_heritage': 'classical',
      'eco_smart': 'industrial', 
      'festive': 'eco_friendly'
    };

    const generatedDesigns = [];
    
    // Generate designs for each type
    for (const designType of typesToGenerate) {
      try {
        console.log(`Generating ${designType} design for upload ${uploadId}`);
        
        // Map frontend design type to database enum
        const dbDesignType = designTypeMap[designType] || designType;
        
        // Call Gemini API to generate facade design
        const generatedImageData = await generateFacadeDesigns(
          upload.file_path,
          designType
        );

        if (generatedImageData && generatedImageData.imageData) {
          // Save the generated image to S3
          const generatedFilename = `${designType}_${uploadId}_${Date.now()}.jpg`;
          const savedImageResult = await saveGeneratedImageToS3(
            generatedImageData.imageData,
            generatedFilename
          );

          // Save to database
          const result = await executeQuery(`
            INSERT INTO generated_designs 
            (upload_id, user_id, design_type, filename, file_path, file_size, width, height, ai_prompt, processing_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            uploadId,
            upload.user_id,  // Use actual integer user_id from upload
            dbDesignType,  // Use mapped design type for database
            generatedFilename,
            savedImageResult.url, // S3 URL instead of local file path
            savedImageResult.fileSize,
            savedImageResult.width,
            savedImageResult.height,
            generatedImageData.prompt || '',
            'completed'
          ]);
          
          const designId = result.insertId;
          generatedDesigns.push({
            designId,
            designType,
            filename: generatedFilename,
            filePath: savedImageResult.url, // S3 URL
            s3Key: savedImageResult.key,
            prompt: generatedImageData.prompt,
            generatedAt: new Date().toISOString()
          });
        }
      } catch (designError) {
        console.error(`Error generating ${designType} design:`, designError);
        // Continue with other designs even if one fails
      }
    }

    if (generatedDesigns.length === 0) {
      return res.status(500).json({
        error: 'Generation failed',
        message: 'Failed to generate any facade designs. Please try again.'
      });
    }

    res.json({
      success: true,
      message: `Successfully generated ${generatedDesigns.length} facade designs`,
      data: {
        uploadId,
        userId: upload.user_id, // Return the actual database user_id
        originalImage: `/uploads/${upload.filename}`,
        generatedDesigns
      }
    });

  } catch (error) {
    console.error('Generate designs error:', error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message || 'An error occurred while generating facade designs'
    });
  }
});

// POST /api/generate/single - Generate a single design type
router.post('/single', async (req, res) => {
  try {
    const { uploadId, userId, designType } = req.body;

    if (!uploadId || !userId || !designType) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Upload ID, User ID, and Design Type are required'
      });
    }

    // Validate design type
    const validTypes = ['modern_premium', 'trust_heritage', 'eco_smart', 'festive'];
    if (!validTypes.includes(designType)) {
      return res.status(400).json({
        error: 'Invalid design type',
        message: `Design type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Get the upload record
    // If userId is provided and is a valid integer, verify ownership; otherwise just find by uploadId
    let uploads;
    if (userId && !isNaN(userId)) {
      // Valid integer user ID - verify ownership
      uploads = await executeQuery(`
        SELECT * FROM uploads WHERE id = ? AND user_id = ?
      `, [uploadId, userId]);
    } else {
      // Anonymous upload or invalid userId - find by uploadId only
      uploads = await executeQuery(`
        SELECT * FROM uploads WHERE id = ?
      `, [uploadId]);
    }

    if (uploads.length === 0) {
      return res.status(404).json({
        error: 'Upload not found',
        message: 'The specified upload was not found'
      });
    }

    const upload = uploads[0];

    // Generate single design
    const generatedImageData = await generateFacadeDesigns(
      upload.file_path,
      designType
    );

    if (!generatedImageData || !generatedImageData.imageData) {
      return res.status(500).json({
        error: 'Generation failed',
        message: 'Failed to generate facade design'
      });
    }

    // Save the generated image to S3
    const generatedFilename = `${designType}_${uploadId}_${Date.now()}.jpg`;
    const savedImageResult = await saveGeneratedImageToS3(
      generatedImageData.imageData,
      generatedFilename
    );

    // Save to database - use the actual user_id from the upload record
    const result = await executeQuery(`
      INSERT INTO generated_designs 
      (upload_id, user_id, design_type, filename, file_path, file_size, width, height, ai_prompt, processing_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uploadId,
      upload.user_id, // Use the user_id from the upload record (integer or null)
      designType,
      generatedFilename,
      savedImageResult.url, // S3 URL
      savedImageResult.fileSize,
      savedImageResult.width,
      savedImageResult.height,
      generatedImageData.prompt || '',
      'completed'
    ]);

    const designId = result.insertId;

    res.json({
      success: true,
      message: 'Facade design generated successfully',
      data: {
        designId,
        uploadId,
        userId: upload.user_id, // Return the actual database user_id
        designType,
        filename: generatedFilename,
        filePath: savedImageResult.url, // S3 URL
        s3Key: savedImageResult.key,
        originalImage: `/uploads/${upload.filename}`, // Local path for original image
        prompt: generatedImageData.prompt,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generate single design error:', error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message || 'An error occurred while generating the facade design'
    });
  }
});

// GET /api/generate/status/:uploadId - Check generation status
router.get('/status/:uploadId', async (req, res) => {
  try {
    const { uploadId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing user ID',
        message: 'User ID is required'
      });
    }

    const designs = await executeQuery(`
      SELECT 
        id as design_id,
        design_type,
        filename,
        file_path,
        ai_prompt,
        created_at,
        processing_status
      FROM generated_designs 
      WHERE upload_id = ? AND user_id = ?
      ORDER BY generation_timestamp DESC
    `, [uploadId, userId]);

    const totalDesigns = 4; // Expected number of design types
    const completedDesigns = designs.length;
    const isComplete = completedDesigns >= totalDesigns;

    res.json({
      success: true,
      data: {
        uploadId,
        userId,
        isComplete,
        totalDesigns,
        completedDesigns,
        designs: designs.map(design => ({
          designId: design.design_id,
          designType: design.design_type,
          filename: design.filename,
          filePath: `/generated/${design.filename}`,
          prompt: design.ai_prompt,
          generatedAt: design.created_at,
          isSelected: design.processing_status === 'completed'
        }))
      }
    });

  } catch (error) {
    console.error('Get generation status error:', error);
    res.status(500).json({
      error: 'Failed to get generation status',
      message: error.message
    });
  }
});

// POST /api/generate/interior - Generate interior designs using Gemini AI
router.post('/interior', async (req, res) => {
  try {
    const { uploadId, userId, designTypes } = req.body;

    if (!uploadId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Upload ID and User ID are required'
      });
    }

    // Get the interior upload record
    console.log('Looking for interior upload with ID:', uploadId, 'and user ID:', userId);
    
    const uploads = await executeQuery(`
      SELECT u.*, gd.design_type as storefront_design_type, gd.file_path as storefront_file_path
      FROM uploads u
      JOIN generated_designs gd ON u.storefront_design_id = gd.id
      WHERE u.id = ? AND u.user_id = ? AND u.upload_type = 'interior'
    `, [uploadId, userId]);

    console.log('Found interior uploads:', uploads.length);
    if (uploads.length === 0) {
      return res.status(404).json({
        error: 'Interior upload not found',
        message: 'The specified interior upload was not found'
      });
    }
    
    const upload = uploads[0];
    console.log('Using interior upload with storefront design type:', upload.storefront_design_type);
    
    // Define design types if not provided - should match storefront style
    const defaultTypes = [
      'modern_premium',
      'trust_heritage', 
      'eco_smart',
      'festive'
    ];
    const typesToGenerate = designTypes || defaultTypes;

    // Map frontend design types to database enum values
    const designTypeMap = {
      'modern_premium': 'modern',
      'trust_heritage': 'classical',
      'eco_smart': 'industrial', 
      'festive': 'eco_friendly'
    };

    const generatedDesigns = [];
    
    // Generate interior designs for each type
    for (const designType of typesToGenerate) {
      try {
        console.log(`Generating interior ${designType} design for upload ${uploadId}`);
        
        // Map frontend design type to database enum
        const dbDesignType = designTypeMap[designType] || designType;
        
        // Call Gemini API to generate interior design with different prompt
        const generatedImageData = await generateInteriorDesigns(
          upload.file_path,
          designType,
          upload.storefront_design_type
        );

        if (generatedImageData && generatedImageData.imageData) {
          // Save the generated image to S3
          const generatedFilename = `interior_${designType}_${uploadId}_${Date.now()}.jpg`;
          const savedImageResult = await saveGeneratedImageToS3(
            generatedImageData.imageData,
            generatedFilename
          );

          // Save to database with interior flag
          const result = await executeQuery(`
            INSERT INTO generated_designs 
            (upload_id, user_id, design_type, filename, file_path, file_size, width, height, ai_prompt, processing_status, is_interior, storefront_design_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            uploadId,
            upload.user_id,
            dbDesignType,
            generatedFilename,
            savedImageResult.url, // S3 URL
            savedImageResult.fileSize,
            savedImageResult.width,
            savedImageResult.height,
            generatedImageData.prompt || '',
            'completed',
            true, // is_interior
            upload.storefront_design_id
          ]);
          
          const designId = result.insertId;
          generatedDesigns.push({
            designId,
            designType,
            filename: generatedFilename,
            filePath: savedImageResult.url, // S3 URL
            s3Key: savedImageResult.key,
            prompt: generatedImageData.prompt,
            generatedAt: new Date().toISOString(),
            isInterior: true,
            storefrontDesignId: upload.storefront_design_id
          });
        }
      } catch (designError) {
        console.error(`Error generating interior ${designType} design:`, designError);
        // Continue with other designs even if one fails
      }
    }

    if (generatedDesigns.length === 0) {
      return res.status(500).json({
        error: 'Interior generation failed',
        message: 'Failed to generate any interior designs. Please try again.'
      });
    }

    // Get the storefront design info for response
    const storefrontDesign = await executeQuery(`
      SELECT * FROM generated_designs WHERE id = ?
    `, [upload.storefront_design_id]);

    res.json({
      success: true,
      message: `Successfully generated ${generatedDesigns.length} interior designs`,
      data: {
        uploadId,
        userId: upload.user_id,
        originalImage: `/uploads/${upload.filename}`,
        storefrontDesign: storefrontDesign[0] ? {
          designId: storefrontDesign[0].id,
          designType: storefrontDesign[0].design_type,
          filePath: `/generated/${storefrontDesign[0].filename}`
        } : null,
        generatedDesigns
      }
    });

  } catch (error) {
    console.error('Generate interior designs error:', error);
    res.status(500).json({
      error: 'Interior generation failed',
      message: error.message || 'An error occurred while generating interior designs'
    });
  }
});

export default router;