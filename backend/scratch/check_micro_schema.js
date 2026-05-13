const pool = require('../src/config/mysqlDb');

async function checkSchema() {
  try {
    const tables = ['micro_schedule', 'micro_schedule_items', 'micro_schedule_tracking'];
    for (const table of tables) {
      console.log(`Checking schema for ${table}...`);
      try {
        const [rows] = await pool.execute(`DESCRIBE ${table}`);
        console.table(rows);
      } catch (e) {
        console.log(`${table} does not exist or error: ${e.message}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error checking schema:', err);
    process.exit(1);
  }
}

checkSchema();
