const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'atlas_sams_db'
  });
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_assignments (
        id int(11) NOT NULL AUTO_INCREMENT,
        teacher_id int(11) NOT NULL,
        class_id int(11) NOT NULL,
        section_id int(11) NOT NULL,
        subject_id int(11) NOT NULL,
        academic_year varchar(20) DEFAULT '2024-2025',
        created_at timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (id),
        UNIQUE KEY unique_assignment (teacher_id, class_id, section_id, subject_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created teacher_assignments table successfully.');
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
