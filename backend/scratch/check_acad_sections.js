require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM acad_sections");
    console.log("ACAD_SECTIONS COLUMNS:");
    console.log(JSON.stringify(cols, null, 2));

    const [rows] = await pool.query("SELECT * FROM acad_sections");
    console.log("ACAD_SECTIONS ROWS:");
    console.log(JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
