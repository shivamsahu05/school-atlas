require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const targetTeacherId = 9; // Shyamlal M.V (user_id = 9)
    const [rows] = await pool.execute(`
      SELECT 
        tt.day_of_week as dayOfWeek,
        ts.start_time as startTime,
        ts.end_time as endTime,
        ac.class_number as className,
        COALESCE(asec.code, tt.section) as sectionCode,
        COALESCE(s.code, s.name) as subjectCode,
        s.name as subjectName,
        'timetable' as type
      FROM teacher_timetable tt
      JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
      LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
      JOIN subjects s ON tt.subject_id = s.id
      JOIN time_slots ts ON tt.time_slot_id = ts.id
      WHERE tt.teacher_id = ?
      ORDER BY 
        FIELD(tt.day_of_week, 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
        ts.start_time ASC
    `, [targetTeacherId]);

    console.log("QUERY RESULTS WITH CODES:");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
