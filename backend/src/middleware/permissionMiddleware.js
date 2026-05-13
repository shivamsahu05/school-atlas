const pool = require('../config/mysqlDb');

/**
 * Middleware to check if the authenticated teacher has time-bound permission for a specific module.
 * @param {string} moduleKey - The key of the module to check (e.g., 'MARKS_ENTRY')
 */
const checkPermission = (moduleKey) => async (req, res, next) => {
  try {
    // req.user is populated by authenticate middleware
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userId = req.user.id;
    console.log(`🛡️ Checking permission for User ID: ${userId}, Module: ${moduleKey}`);

    // Get teacher_id from user_id
    const [teacher] = await pool.query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (teacher.length === 0) {
      if (req.user.role === 'admin') {
        console.log('👑 Admin detected, bypassing permission check.');
        return next(); 
      }
      console.warn(`⚠️ No teacher record found for User ID: ${userId}`);
      return res.status(403).json({ success: false, message: 'Forbidden: No teacher record associated with this account.' });
    }

    const teacherId = teacher[0].id;
    console.log(`👨‍🏫 Teacher ID: ${teacherId}`);

    // Query to check permission
    const query = `
      SELECT tmp.* 
      FROM teacher_module_permissions tmp
      JOIN modules m ON tmp.module_id = m.id
      WHERE tmp.teacher_id = ? 
      AND m.module_key = ? 
      AND tmp.status = 'ACTIVE' 
      AND CURDATE() BETWEEN tmp.start_date AND tmp.end_date
    `;

    const [permissions] = await pool.query(query, [teacherId, moduleKey]);

    if (permissions.length === 0) {
      console.warn(`🚫 Permission DENIED for Teacher ${teacherId} on module ${moduleKey}`);
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: You do not have active permission for the ${moduleKey} module at this time. Please contact Admin.` 
      });
    }

    console.log(`✅ Permission GRANTED for Teacher ${teacherId} on module ${moduleKey}`);
    req.teacherPermission = permissions[0];
    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error during permission check', error: error.message });
  }
};

module.exports = checkPermission;
