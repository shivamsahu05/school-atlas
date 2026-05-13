const cron = require('node-cron');
const pool = require('../config/mysqlDb');

/**
 * Initialize all cron jobs for the application
 */
const initCronJobs = () => {
  // Daily at 12:00 AM
  cron.schedule('0 0 * * *', async () => {
    console.log('🕒 Running daily permission expiry cron job...');
    try {
      const [result] = await pool.query(`
        UPDATE teacher_module_permissions 
        SET status = 'EXPIRED' 
        WHERE end_date < CURDATE() AND status = 'ACTIVE'
      `);
      console.log(`✅ Cron Job: ${result.affectedRows} permissions updated to EXPIRED.`);
    } catch (error) {
      console.error('❌ Cron Job Error (Permission Expiry):', error);
    }
  });

  console.log('🚀 Cron Jobs initialized.');
};

module.exports = initCronJobs;
