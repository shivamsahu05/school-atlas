require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const [syllabus] = await pool.query("SELECT id, teacher_id, class_id, section_id, subject_id, topic, week, month FROM syllabus ORDER BY id DESC LIMIT 10");
    console.log("RECENT SYLLABUS ROWS:");
    console.log(JSON.stringify(syllabus, null, 2));

    const [classes] = await pool.query("SELECT id, name, class_number FROM academic_classes");
    console.log("\nACADEMIC CLASSES:");
    console.log(JSON.stringify(classes, null, 2));

    const [sections] = await pool.query("SELECT id, name, code FROM acad_sections");
    console.log("\nSECTIONS:");
    console.log(JSON.stringify(sections, null, 2));

    const [subjects] = await pool.query("SELECT id, name, code FROM subjects");
    console.log("\nSUBJECTS:");
    console.log(JSON.stringify(subjects, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
