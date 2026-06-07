require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM teacher_timetable");
    console.log("TEACHER_TIMETABLE COLUMNS:");
    console.log(JSON.stringify(cols, null, 2));

    const [rows] = await pool.query("SELECT * FROM teacher_timetable LIMIT 5");
    console.log("TEACHER_TIMETABLE ROWS (LIMIT 5):");
    console.log(JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
