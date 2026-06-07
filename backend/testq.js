const mysql = require('mysql2/promise');
mysql.createConnection({host:'localhost',user:'root',database:'atlas_sams_db'}).then(async c => {
  try {
    const [q1] = await c.execute('SELECT s.id, s.name FROM subjects s JOIN acad_class_subjects cs ON s.id = cs.subject_id WHERE cs.class_id = ? ORDER BY s.name ASC', [8]);
    console.log('q1:', q1);
    const [q2] = await c.execute('SELECT id as student_id, name, roll_no FROM students s WHERE s.class_id = ? AND s.section_id = ? ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, s.roll_no ASC', [8, 5]);
    console.log('q2:', q2);
    const [q3] = await c.execute('SELECT m.student_id, m.subject_id, m.marks_obtained, m.total_marks FROM student_marks m JOIN students s ON m.student_id = s.id WHERE s.class_id = ? AND m.academic_year = ? AND m.status = \'final_saved\'', [8, '2026-27']);
    console.log('q3:', q3);
  } catch(e) { console.error("Error:", e.message); }
  process.exit();
});
