const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sams_db'
  });

  try {
    await conn.query(`ALTER TABLE student_marks DROP INDEX student_exam_subj`);
    console.log("Dropped old unique index");
  } catch(e) { console.log("Drop index error:", e.message); }

  try {
    await conn.query(`ALTER TABLE student_marks ADD UNIQUE KEY student_exam_subj (student_id, subject_id, exam_type, academic_year)`);
    console.log("Added new unique index");
  } catch(e) { console.log("Add index error:", e.message); }

  try {
    await conn.query(`ALTER TABLE student_marks ADD COLUMN entered_by_user_id INT NULL`);
    console.log("Added entered_by_user_id column");
  } catch(e) { console.log("Add column error:", e.message); }

  process.exit();
}
run();
