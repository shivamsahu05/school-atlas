// src/controllers/followupController.js
const pool = require('../config/mysqlDb');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * GET /api/admin/followups
 * Returns only followup-relevant data: Observations and Admin Notes (Contact Inquiries)
 */
const getFollowUps = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // 1. Fetch only Leaves data - filtered by Pending status by default for follow-ups
    let sql = `
      SELECT l.id, l.user_id, l.type, l.from_date, l.to_date, l.reason, l.status, l.created_at,
             u.name AS teacher_name
      FROM leave_requests l
      JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (month && month !== 'All') {
      sql += ` AND (MONTHNAME(l.from_date) = ? OR MONTHNAME(l.to_date) = ?) `;
      params.push(month, month);
    }
    if (year && year !== 'All') {
      sql += ` AND (YEAR(l.from_date) = ? OR YEAR(l.to_date) = ?) `;
      params.push(year, year);
    }

    sql += ` ORDER BY l.created_at DESC LIMIT 100`;

    const [leaves] = await pool.execute(sql, params);

    // Grouping by status for summary
    const summary = {
      totalPending: leaves.filter(l => l.status === 'Pending').length,
      totalRequests: leaves.length
    };

    console.log(`[FOLLOWUPS] Fetched ${leaves.length} leave records.`);
    
    return sendSuccess(res, {
      leaves: leaves || [],
      summary
    });
  } catch (err) {
    console.error('[FOLLOWUPS ERROR]:', err);
    return sendError(res, 'Failed to fetch leave follow-up data: ' + err.message, 500);
  }
};

module.exports = { getFollowUps };
