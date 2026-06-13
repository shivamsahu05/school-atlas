require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function testAdmin() {
  try {
    const [rows] = await pool.execute(`
      SELECT DISTINCT classId, className, sectionId, sectionName, subjectId, subjectName
      FROM (
        SELECT DISTINCT 
          ac.id as classId, ac.class_number as className,
          asec.id as sectionId, asec.name as sectionName,
          s.id as subjectId, s.name as subjectName
        FROM teacher_timetable tt
        JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
        LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
        JOIN subjects s ON tt.subject_id = s.id
        WHERE ac.id IS NOT NULL AND s.id IS NOT NULL

        UNION

        SELECT DISTINCT 
          ac.id as classId, ac.class_number as className,
          asec.id as sectionId, asec.name as sectionName,
          s.id as subjectId, s.name as subjectName
        FROM syllabus sy
        JOIN academic_classes ac ON sy.class_id = ac.id
        LEFT JOIN acad_sections asec ON sy.section_id = asec.id
        JOIN subjects s ON sy.subject_id = s.id
        WHERE ac.id IS NOT NULL AND s.id IS NOT NULL
      ) as combined
      ORDER BY className ASC, sectionName ASC
    `);
    console.log("ADMIN ASSIGNMENTS COUNT:", rows.length);
    console.log("Class 2 rows:", rows.filter(r => String(r.className) === '2'));
  } catch (e) {
    console.error(e);
  }
}

testAdmin();
