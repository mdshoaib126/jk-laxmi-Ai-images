import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../config/db.js';

const router = express.Router();

// POST /api/share - Log social share and return contest link
router.post('/', async (req, res) => {
  try {
    const { userId, designId, platform } = req.body;

    if (!userId || !designId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'User ID and Design ID are required'
      });
    }

    // Verify the design exists and belongs to the user
    const designs = await executeQuery(`
      SELECT 
        gd.id,
        gd.design_type,
        gd.filename,
        u.original_name,
        usr.dealership_name,
        usr.sap_code
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

    // Log the share
    const shareCode = uuidv4();
    const result = await executeQuery(`
      INSERT INTO shares (user_id, design_id, share_platform, share_type, share_code)
      VALUES (?, ?, ?, 'contest', ?)
    `, [userId, designId, platform || 'unknown', shareCode]);
    
    const shareId = result.insertId;

    // Generate contest link and sharing content
    const contestUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contest/${shareCode}`;
    
    const shareContent = {
      title: `Check out my ${design.design_type.replace('_', ' ')} façade design!`,
      text: `I transformed my shop with JK Lakshmi Cement's AR design app! ${design.dealership_name ? `- ${design.dealership_name}` : ''} ${design.sap_code ? `(${design.sap_code})` : ''}`,
      url: contestUrl,
      hashtags: ['JKLakshmi', 'FacadeDesign', 'ARDesign', 'CementDesign', 'ShopMakeover']
    };

    // Generate sharing URLs for different platforms
    const sharingUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(contestUrl)}&quote=${encodeURIComponent(shareContent.text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.text)}&url=${encodeURIComponent(contestUrl)}&hashtags=${shareContent.hashtags.join(',')}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareContent.text} ${contestUrl}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(contestUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(contestUrl)}&text=${encodeURIComponent(shareContent.text)}`
    };

    res.json({
      success: true,
      message: 'Share logged successfully',
      data: {
        shareId,
        shareCode,
        contestUrl,
        shareContent,
        sharingUrls,
        design: {
          designId: design.id,
          designType: design.design_type,
          filename: design.generated_filename,
          filePath: `/generated/${design.generated_filename}`
        },
        userInfo: {
          dealershipName: design.dealership_name,
          sapCode: design.sap_code
        }
      }
    });

  } catch (error) {
    console.error('Share logging error:', error);
    res.status(500).json({
      error: 'Failed to log share',
      message: error.message
    });
  }
});

// GET /api/share/contest/:shareCode - Get contest entry details
router.get('/contest/:shareCode', async (req, res) => {
  try {
    const { shareCode } = req.params;

    const shares = await executeQuery(`
      SELECT 
        s.id as share_id,
        s.share_code,
        s.share_platform,
        s.shared_at,
        gd.design_type,
        gd.filename,
        gd.ai_prompt,
        u.original_name,
        u.filename as stored_filename,
        usr.dealership_name,
        usr.sap_code,
        usr.mobile_number
      FROM shares s
      LEFT JOIN generated_designs gd ON s.design_id = gd.id
      LEFT JOIN uploads u ON gd.upload_id = u.id
      LEFT JOIN users usr ON s.user_id = usr.id
      WHERE s.share_code = ?
    `, [shareCode]);

    if (shares.length === 0) {
      return res.status(404).json({
        error: 'Contest entry not found',
        message: 'The specified contest entry was not found'
      });
    }

    const share = shares[0];

    res.json({
      success: true,
      data: {
        shareId: share.share_id,
        shareCode: share.share_code,
        platform: share.share_platform,
        sharedAt: share.shared_at,
        design: {
          designType: share.design_type,
          filename: share.filename,
          filePath: `/generated/${share.filename}`,
          prompt: share.ai_prompt
        },
        originalImage: {
          filename: share.original_name,
          filePath: `/uploads/${share.stored_filename}`
        },
        participant: {
          dealershipName: share.dealership_name,
          sapCode: share.sap_code,
          mobileNumber: share.mobile_number
        }
      }
    });

  } catch (error) {
    console.error('Get contest entry error:', error);
    res.status(500).json({
      error: 'Failed to fetch contest entry',
      message: error.message
    });
  }
});

// GET /api/share/user/:userId - Get user's shares
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { platform, contestOnly } = req.query;

    let query = `
      SELECT 
        s.id as share_id,
        s.design_id,
        s.share_code,
        s.share_platform,
        s.shared_at,
        gd.design_type,
        gd.filename
      FROM shares s
      LEFT JOIN generated_designs gd ON s.design_id = gd.id
      WHERE s.user_id = ?
    `;
    
    const params = [userId];

    if (platform) {
      query += ' AND s.share_platform = ?';
      params.push(platform);
    }

    if (contestOnly === 'true') {
      query += ' AND s.share_type = "contest"';
    }

    query += ' ORDER BY s.shared_at DESC';

    const shares = await executeQuery(query, params);

    res.json({
      success: true,
      data: shares.map(share => ({
        shareId: share.share_id,
        shareCode: share.share_code,
        designId: share.design_id,
        platform: share.share_platform,
        sharedAt: share.shared_at,
        design: {
          designType: share.design_type,
          filename: share.filename,
          filePath: `/generated/${share.filename}`
        },
        contestUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contest/${share.share_code}`
      }))
    });

  } catch (error) {
    console.error('Get user shares error:', error);
    res.status(500).json({
      error: 'Failed to fetch user shares',
      message: error.message
    });
  }
});

// GET /api/share/leaderboard - Get contest leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const leaderboard = await executeQuery(`
      SELECT 
        usr.dealership_name,
        usr.sap_code,
        usr.mobile_number,
        COUNT(s.id) as total_shares,
        COUNT(DISTINCT s.design_id) as unique_designs_shared,
        COUNT(DISTINCT s.share_platform) as platforms_used,
        MAX(s.shared_at) as latest_share
      FROM users usr
      INNER JOIN shares s ON usr.id = s.user_id
      WHERE s.share_type = 'contest'
      GROUP BY usr.id, usr.dealership_name, usr.sap_code, usr.mobile_number
      ORDER BY total_shares DESC, latest_share DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((entry, index) => ({
          rank: index + 1,
          participant: {
            dealershipName: entry.dealership_name,
            sapCode: entry.sap_code,
            mobileNumber: entry.mobile_number
          },
          stats: {
            totalShares: entry.total_shares,
            uniqueDesigns: entry.unique_designs_shared,
            platformsUsed: entry.platforms_used,
            latestShare: entry.latest_share
          }
        })),
        totalParticipants: leaderboard.length
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

// GET /api/share/stats - Get overall sharing statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as total_shares,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT design_id) as unique_designs,
        share_platform,
        COUNT(*) as shares_by_platform
      FROM shares
      WHERE share_type = 'contest'
      GROUP BY share_platform
    `);

    const totalStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_shares,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT design_id) as unique_designs
      FROM shares
      WHERE share_type = 'contest'
    `);

    res.json({
      success: true,
      data: {
        totalShares: totalStats[0]?.total_shares || 0,
        uniqueUsers: totalStats[0]?.unique_users || 0,
        uniqueDesigns: totalStats[0]?.unique_designs || 0,
        sharesByPlatform: stats.reduce((acc, stat) => {
          if (stat.share_platform) {
            acc[stat.share_platform] = stat.shares_by_platform;
          }
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get sharing stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch sharing statistics',
      message: error.message
    });
  }
});

export default router;