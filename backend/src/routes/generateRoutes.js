import express from 'express';
import { executeQuery } from '../config/db.js';
import { generateFacadeDesigns } from '../services/geminiService.js';
import { saveGeneratedImage } from '../services/imageUtils.js';

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
          // Save the generated image
          const generatedFilename = `${designType}_${uploadId}_${Date.now()}.png`;
          const savedImagePath = await saveGeneratedImage(
            generatedImageData.imageData,
            generatedFilename
          );

          // Save to database
          const result = await executeQuery(`
            INSERT INTO generated_designs 
            (upload_id, user_id, design_type, filename, file_path, ai_prompt, processing_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            uploadId,
            upload.user_id,  // Use actual integer user_id from upload
            dbDesignType,  // Use mapped design type for database
            generatedFilename,
            savedImagePath,
            generatedImageData.prompt || '',
            'completed'
          ]);
          
          const designId = result.insertId;
          generatedDesigns.push({
            designId,
            designType,
            filename: generatedFilename,
            filePath: `/generated/${generatedFilename}`,
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

    // Save the generated image
    const generatedFilename = `${designType}_${uploadId}_${Date.now()}.png`;
    const savedImagePath = await saveGeneratedImage(
      generatedImageData.imageData,
      generatedFilename
    );

    // Save to database - use the actual user_id from the upload record
    const result = await executeQuery(`
      INSERT INTO generated_designs 
      (upload_id, user_id, design_type, filename, file_path, ai_prompt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      uploadId,
      upload.user_id, // Use the user_id from the upload record (integer or null)
      designType,
      generatedFilename,
      savedImagePath,
      generatedImageData.prompt || ''
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
        filePath: `/generated/${generatedFilename}`,
        originalImage: `/uploads/${upload.filename}`,
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

export default router;