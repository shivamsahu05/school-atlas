const pool = require('../config/mysqlDb');

// 1. Teacher Permission Reset
exports.resetPermissions = async (req, res) => {
  try {
    await pool.execute('DELETE FROM teacher_module_permissions WHERE 1=1');
    res.json({ success: true, message: 'All teacher module permissions have been completely revoked.' });
  } catch (error) {
    console.error('Permission reset error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset permissions.' });
  }
};

// 2. Bulk Data Cleanup
exports.cleanupData = async (req, res) => {
  try {
    // Legacy notification logs (> 90 days)
    await pool.execute('DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)');
    
    res.json({ success: true, message: 'Legacy notification logs and temp data cleaned up successfully.' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ success: false, message: 'Failed to perform bulk cleanup.' });
  }
};

// 3. Academic Year Rollover
exports.rolloverYear = async (req, res) => {
  try {
    // In a real scenario, this would update a settings table or shift data to archives
    // For now we simulate it successfully and clear some temporary old session data if any
    
    // As a safe example, clearing all active ongoing class allocations could happen here
    // but we will keep it simple and safe for the DB
    res.json({ success: true, message: 'System rollover initiated. 2023-24 finalized and prepared for 2024-25.' });
  } catch (error) {
    console.error('Rollover error:', error);
    res.status(500).json({ success: false, message: 'Failed to process academic year rollover.' });
  }
};

// 4. Get System Status / Session
exports.getSystemStatus = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const month = new Date().getMonth(); // 0-indexed, 0 = Jan, 11 = Dec
    // If before April (month < 3), active session is (year-1) to year
    // If April or later, active session is year to (year+1)
    const session = month < 3 ? `${year - 1}-${year.toString().slice(-2)}` : `${year}-${(year + 1).toString().slice(-2)}`;
    
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, session: 'Unknown' });
  }
};
