require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const [rows] = await pool.query(`
      SELECT t.id as teacher_profile_id, t.user_id, u.name, u.role 
      FROM teachers t 
      JOIN users u ON t.user_id = u.id 
      WHERE u.name LIKE '%Devi%'
    `);
    console.log("DEVI TEACHER PROFILE:");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
