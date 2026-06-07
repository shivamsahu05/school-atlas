require('dotenv').config();
const pool = require('../src/config/mysqlDb');

async function check() {
  try {
    const [rows] = await pool.query(`
      SELECT acs.id, acs.class_id, acs.section_id, ac.name as class_name, asec.name as section_name 
      FROM acad_class_sections acs
      JOIN academic_classes ac ON acs.class_id = ac.id
      JOIN acad_sections asec ON acs.section_id = asec.id
      WHERE acs.class_id = 9
    `);
    console.log("CLASS 2 SECTIONS IN ACAD_CLASS_SECTIONS:");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
