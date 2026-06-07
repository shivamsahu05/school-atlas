require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function setup() {
  try {
    // 1. Insert module if not exists
    await pool.execute(`
      INSERT INTO modules (module_key, module_name)
      SELECT 'MARKS_ENTRY', 'Marks Entry'
      WHERE NOT EXISTS (
        SELECT 1 FROM modules WHERE module_key = 'MARKS_ENTRY'
      )
    `);
    console.log('Inserted MARKS_ENTRY module.');

    // 2. Create student_marks table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS student_marks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        class_id INT NOT NULL,
        section_id INT NOT NULL,
        subject_id INT NOT NULL,
        exam_type VARCHAR(50) NOT NULL,
        marks_obtained DECIMAL(5,2),
        total_marks DECIMAL(5,2),
        status ENUM('draft', 'final_saved') DEFAULT 'draft',
        teacher_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY student_exam_subj (student_id, exam_type, subject_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (class_id) REFERENCES academic_classes(id) ON DELETE CASCADE,
        FOREIGN KEY (section_id) REFERENCES acad_sections(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
        FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
      )
    `);
    console.log('Created student_marks table.');

  } catch (err) {
    console.error('Error in setup:', err);
  } finally {
    process.exit(0);
  }
}

setup();
