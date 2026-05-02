const pool = require('../src/config/mysqlDb');

async function run() {
  try {
    console.log('--- UPDATING DATABASE FOR MICRO SCHEDULE ---');

    // 1. Add Micro Schedule module
    await pool.query("INSERT IGNORE INTO modules (id, module_key, module_name) VALUES (5, 'MICRO_SCHEDULE', 'Micro Schedule')");
    console.log('✅ Micro Schedule module added');

    // 2. Enhance teacher_timetable
    // Check if columns exist first
    const [cols] = await pool.query("SHOW COLUMNS FROM teacher_timetable");
    const colNames = cols.map(c => c.Field);

    if (!colNames.includes('topic')) {
      await pool.query("ALTER TABLE teacher_timetable ADD COLUMN topic VARCHAR(255) DEFAULT NULL");
      console.log('✅ Added topic column');
    }
    if (!colNames.includes('status')) {
      await pool.query("ALTER TABLE teacher_timetable ADD COLUMN status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending'");
      console.log('✅ Added status column');
    }

    console.log('--- DB UPDATE COMPLETE ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ DB UPDATE FAILED:', error);
    process.exit(1);
  }
}

run();
