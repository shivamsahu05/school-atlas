require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM subjects");
    console.log("SUBJECTS COLUMNS:");
    console.log(JSON.stringify(cols, null, 2));

    const [rows] = await pool.query("SELECT * FROM subjects LIMIT 5");
    console.log("SUBJECTS ROWS:");
    console.log(JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
