const pool = require('../src/config/mysqlDb');

async function checkSchema() {
  try {
    console.log('Checking schema for syllabus_plan...');
    const [rows] = await pool.execute('DESCRIBE syllabus_plan');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking schema:', err);
    process.exit(1);
  }
}

checkSchema();
