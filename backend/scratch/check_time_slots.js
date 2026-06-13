require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const [cols] = await pool.query("SHOW TABLES");
    console.log("ALL TABLES:", cols);

    const [timeSlotsCols] = await pool.query("SHOW COLUMNS FROM time_slots");
    console.log("TIME_SLOTS COLUMNS:");
    console.log(JSON.stringify(timeSlotsCols, null, 2));

    const [rows] = await pool.query("SELECT * FROM time_slots");
    console.log("TIME_SLOTS ROWS:");
    console.log(JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
