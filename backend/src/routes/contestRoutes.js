import express from 'express';
import { executeQuery } from '../config/db.js';
import crypto from 'crypto';

const router = express.Router();

// GET /api/contest/check-submission - Check if submission already exists
router.get('/check-submission', async (req, res) => {
  try {
    const { userId, storefrontDesignId, interiorDesignId } = req.query;

    if (!userId || !storefrontDesignId || !interiorDesignId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Check if submission already exists
    const existingSubmission = await executeQuery(`
      SELECT 
        cs.id,
        cs.submission_id,
        cs.submitted_at,
        cs.dealership_name,
        cs.sap_code,
        cs.mobile_number
      FROM contest_submissions cs
      WHERE cs.user_id = ? 
        AND cs.storefront_design_id = ? 
        AND cs.interior_design_id = ?
      ORDER BY cs.submitted_at DESC
      LIMIT 1
    `, [userId, storefrontDesignId, interiorDesignId]);

    if (existingSubmission.length > 0) {
      return res.json({
        success: true,
        data: {
          submissionId: existingSubmission[0].submission_id,
          submittedAt: existingSubmission[0].submitted_at,
          dealershipName: existingSubmission[0].dealership_name,
          sapCode: existingSubmission[0].sap_code,
          mobileNumber: existingSubmission[0].mobile_number
        }
      });
    } else {
      return res.json({
        success: true,
        data: null // No existing submission found
      });
    }

  } catch (error) {
    console.error('Check submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: error.message
    });
  }
});

// GET /api/contest/user-submissions/:userId - Get all submissions for a user
router.get('/user-submissions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing user ID parameter'
      });
    }

    // Get all submissions for this user
    const submissions = await executeQuery(`
      SELECT 
        cs.id,
        cs.submission_id,
        cs.submitted_at,
        cs.dealership_name,
        cs.sap_code,
        cs.mobile_number,
        cs.storefront_design_id,
        cs.interior_design_id,
        gd1.design_type as storefront_type,
        gd2.design_type as interior_type
      FROM contest_submissions cs
      LEFT JOIN generated_designs gd1 ON cs.storefront_design_id = gd1.id
      LEFT JOIN generated_designs gd2 ON cs.interior_design_id = gd2.id
      WHERE cs.user_id = ?
      ORDER BY cs.submitted_at DESC
    `, [userId]);

    return res.json({
      success: true,
      data: submissions
    });

  } catch (error) {
    console.error('Get user submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: error.message
    });
  }
});

// POST /api/contest/submit - Submit contest entry with storefront and interior designs
router.post('/submit', async (req, res) => {
  try {
    let { 
      userId, 
      storefrontDesignId, 
      interiorDesignId, 
      dealershipName, 
      sapCode, 
      mobileNumber 
    } = req.body;

    console.log('Contest submission request:', {
      userId,
      storefrontDesignId,
      interiorDesignId,
      dealershipName,
      sapCode,
      mobileNumber
    });

    // Handle case where userId might be an array (similar to upload issue)
    if (Array.isArray(userId)) {
      userId = userId.find(id => id && id !== 'undefined' && id !== 'null') || userId[userId.length - 1];
    }

    if (!userId || userId === 'undefined' || userId === 'null' || !storefrontDesignId || !interiorDesignId) {
      console.log('Missing required fields:', { userId, storefrontDesignId, interiorDesignId });
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID, storefront design ID, and interior design ID are required'
      });
    }

    // Verify both designs belong to the user
    const designCheck = await executeQuery(`
      SELECT 
        gd1.id as storefront_id,
        gd1.design_type as storefront_type,
        gd1.filename as storefront_filename,
        gd1.file_path as storefront_path,
        gd2.id as interior_id,
        gd2.design_type as interior_type,
        gd2.filename as interior_filename,
        gd2.file_path as interior_path,
        gd2.is_interior
      FROM generated_designs gd1
      CROSS JOIN generated_designs gd2
      WHERE gd1.id = ? AND gd1.user_id = ? AND (gd1.is_interior = false OR gd1.is_interior = 0)
        AND gd2.id = ? AND gd2.user_id = ? AND (gd2.is_interior = true OR gd2.is_interior = 1)
    `, [storefrontDesignId, userId, interiorDesignId, userId]);

    console.log('Design check query result:', designCheck);
    console.log('Query parameters:', { storefrontDesignId, userId, interiorDesignId });

    if (designCheck.length === 0) {
      // Let's also check what designs exist for this user
      const userDesigns = await executeQuery(`
        SELECT id, design_type, is_interior, user_id, created_at 
        FROM generated_designs 
        WHERE user_id = ?
        ORDER BY created_at DESC
      `, [userId]);
      
      console.log('All user designs:', userDesigns);
      
      return res.status(403).json({
        error: 'Invalid designs',
        message: 'One or both designs not found or do not belong to user'
      });
    }

    const designs = designCheck[0];

    // Generate unique submission ID
    const submissionId = `JK-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Check if user already has a submission
    const existingSubmission = await executeQuery(`
      SELECT id FROM contest_submissions WHERE user_id = ? LIMIT 1
    `, [userId]);

    let submissionResult;

    if (existingSubmission.length > 0) {
      // Update existing submission
      submissionResult = await executeQuery(`
        UPDATE contest_submissions SET
          storefront_design_id = ?,
          interior_design_id = ?,
          dealership_name = ?,
          sap_code = ?,
          mobile_number = ?,
          submission_id = ?,
          submitted_at = CURRENT_TIMESTAMP,
          status = 'submitted'
        WHERE user_id = ?
      `, [
        storefrontDesignId,
        interiorDesignId,
        dealershipName,
        sapCode,
        mobileNumber,
        submissionId,
        userId
      ]);
    } else {
      // Create new submission
      submissionResult = await executeQuery(`
        INSERT INTO contest_submissions (
          user_id,
          storefront_design_id,
          interior_design_id,
          dealership_name,
          sap_code,
          mobile_number,
          submission_id,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')
      `, [
        userId,
        storefrontDesignId,
        interiorDesignId,
        dealershipName,
        sapCode,
        mobileNumber,
        submissionId
      ]);
    }

    res.json({
      success: true,
      message: 'Contest entry submitted successfully',
      data: {
        submissionId,
        userId,
        storefrontDesign: {
          designId: designs.storefront_id,
          designType: designs.storefront_type,
          filename: designs.storefront_filename,
          filePath: `/generated/${designs.storefront_filename}`
        },
        interiorDesign: {
          designId: designs.interior_id,
          designType: designs.interior_type,
          filename: designs.interior_filename,
          filePath: `/generated/${designs.interior_filename}`
        },
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Contest submission error:', error);
    res.status(500).json({
      error: 'Submission failed',
      message: error.message || 'An error occurred while submitting contest entry'
    });
  }
});

// GET /api/contest/submissions/:userId - Get user's contest submissions
router.get('/submissions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const submissions = await executeQuery(`
      SELECT 
        cs.*,
        gd1.design_type as storefront_type,
        gd1.filename as storefront_filename,
        gd1.file_path as storefront_path,
        gd2.design_type as interior_type,
        gd2.filename as interior_filename,
        gd2.file_path as interior_path
      FROM contest_submissions cs
      LEFT JOIN generated_designs gd1 ON cs.storefront_design_id = gd1.id
      LEFT JOIN generated_designs gd2 ON cs.interior_design_id = gd2.id
      WHERE cs.user_id = ?
      ORDER BY cs.submitted_at DESC
    `, [userId]);

    res.json({
      success: true,
      data: submissions.map(sub => ({
        submissionId: sub.submission_id,
        userId: sub.user_id,
        dealershipName: sub.dealership_name,
        sapCode: sub.sap_code,
        mobileNumber: sub.mobile_number,
        status: sub.status,
        submittedAt: sub.submitted_at,
        storefrontDesign: {
          designId: sub.storefront_design_id,
          designType: sub.storefront_type,
          filename: sub.storefront_filename,
          filePath: `/generated/${sub.storefront_filename}`
        },
        interiorDesign: {
          designId: sub.interior_design_id,
          designType: sub.interior_type,
          filename: sub.interior_filename,
          filePath: `/generated/${sub.interior_filename}`
        }
      }))
    });

  } catch (error) {
    console.error('Get contest submissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch contest submissions',
      message: error.message
    });
  }
});

// GET /api/contest/submission/:submissionId - Get specific contest submission
router.get('/submission/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submissions = await executeQuery(`
      SELECT 
        cs.*,
        gd1.design_type as storefront_type,
        gd1.filename as storefront_filename,
        gd1.file_path as storefront_path,
        gd2.design_type as interior_type,
        gd2.filename as interior_filename,
        gd2.file_path as interior_path,
        usr.dealership_name as user_dealership,
        usr.sap_code as user_sap,
        usr.mobile_number as user_mobile
      FROM contest_submissions cs
      LEFT JOIN generated_designs gd1 ON cs.storefront_design_id = gd1.id
      LEFT JOIN generated_designs gd2 ON cs.interior_design_id = gd2.id
      LEFT JOIN users usr ON cs.user_id = usr.id
      WHERE cs.submission_id = ?
      LIMIT 1
    `, [submissionId]);

    if (submissions.length === 0) {
      return res.status(404).json({
        error: 'Submission not found',
        message: 'The specified contest submission was not found'
      });
    }

    const sub = submissions[0];

    res.json({
      success: true,
      data: {
        submissionId: sub.submission_id,
        userId: sub.user_id,
        dealershipName: sub.dealership_name || sub.user_dealership,
        sapCode: sub.sap_code || sub.user_sap,
        mobileNumber: sub.mobile_number || sub.user_mobile,
        status: sub.status,
        submittedAt: sub.submitted_at,
        storefrontDesign: {
          designId: sub.storefront_design_id,
          designType: sub.storefront_type,
          filename: sub.storefront_filename,
          filePath: `/generated/${sub.storefront_filename}`
        },
        interiorDesign: {
          designId: sub.interior_design_id,
          designType: sub.interior_type,
          filename: sub.interior_filename,
          filePath: `/generated/${sub.interior_filename}`
        }
      }
    });

  } catch (error) {
    console.error('Get contest submission error:', error);
    res.status(500).json({
      error: 'Failed to fetch contest submission',
      message: error.message
    });
  }
});

// GET /api/contest/leaderboard - Get contest leaderboard (admin function)
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50, status = 'submitted' } = req.query;

    const leaderboard = await executeQuery(`
      SELECT 
        cs.submission_id,
        cs.dealership_name,
        cs.sap_code,
        cs.submitted_at,
        cs.status,
        gd1.design_type as storefront_type,
        gd2.design_type as interior_type,
        usr.dealership_name as user_dealership
      FROM contest_submissions cs
      LEFT JOIN generated_designs gd1 ON cs.storefront_design_id = gd1.id
      LEFT JOIN generated_designs gd2 ON cs.interior_design_id = gd2.id
      LEFT JOIN users usr ON cs.user_id = usr.id
      WHERE cs.status = ?
      ORDER BY cs.submitted_at DESC
      LIMIT ?
    `, [status, parseInt(limit)]);

    res.json({
      success: true,
      data: {
        totalSubmissions: leaderboard.length,
        submissions: leaderboard.map(sub => ({
          submissionId: sub.submission_id,
          dealershipName: sub.dealership_name || sub.user_dealership,
          sapCode: sub.sap_code,
          submittedAt: sub.submitted_at,
          status: sub.status,
          designTypes: {
            storefront: sub.storefront_type,
            interior: sub.interior_type
          }
        }))
      }
    });

  } catch (error) {
    console.error('Get contest leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch contest leaderboard',
      message: error.message
    });
  }
});

export default router;