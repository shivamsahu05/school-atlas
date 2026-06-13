require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const [rows] = await pool.query("SELECT id, class_name, section FROM classes");
    console.log("LEGACY CLASSES:");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
