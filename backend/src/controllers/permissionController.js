// src/controllers/permissionController.js
const pool = require('../config/mysqlDb');

const sendOk = (res, data, msg = 'OK', code = 200) => res.status(code).json({ success: true, data, message: msg });
const sendErr = (res, msg = 'Error', code = 500) => res.status(code).json({ success: false, message: msg });

// GET /api/admin/permissions/meta — teachers, modules, classes, subjects for form dropdowns
exports.getMeta = async (req, res) => {
  try {
    const [teachersRes, modulesRes, classesRes, sectionsRes, subjectsRes] = await Promise.all([
      pool.execute(`
        SELECT t.id, u.name, u.email
        FROM teachers t JOIN users u ON t.user_id = u.id
        WHERE t.is_deleted = 0 ORDER BY u.name
      `),
      pool.execute('SELECT id, module_key, module_name FROM modules ORDER BY id'),
      pool.execute('SELECT id, name FROM academic_classes ORDER BY name'),
      pool.execute(`
        SELECT cs.id, cs.class_id, s.name
        FROM acad_class_sections cs
        JOIN acad_sections s ON cs.section_id = s.id
        ORDER BY s.name
      `),
      pool.execute('SELECT id, name FROM subjects ORDER BY name'),
    ]);

    const teachers = teachersRes[0];
    const modules = modulesRes[0];
    const classes = classesRes[0];
    const sections = sectionsRes[0];
    const subjects = subjectsRes[0];

    return sendOk(res, { teachers, modules, classes, sections, subjects });
  } catch (err) {
    console.error('CRITICAL PERMISSION ERROR:', err);
    return sendErr(res, `Database Error: ${err.message}`);
  }
};

// GET /api/admin/permissions/active
exports.getActive = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT tmp.id, tmp.start_date, tmp.end_date, tmp.status,
             tmp.teacher_id, tmp.module_id, tmp.class_id, tmp.section_id, tmp.subject_id,
             DATEDIFF(tmp.end_date, CURDATE()) AS daysLeft,
             u.name AS teacher,
             m.module_name AS module, m.module_key,
             c.name AS class_name,
             sec.name AS section,
             s.name AS subject
      FROM teacher_module_permissions tmp
      JOIN teachers t  ON tmp.teacher_id  = t.id
      JOIN users    u  ON t.user_id        = u.id
      JOIN modules  m  ON tmp.module_id    = m.id
      LEFT JOIN academic_classes c ON tmp.class_id   = c.id
      LEFT JOIN acad_sections  sec ON tmp.section_id = sec.id
      LEFT JOIN subjects s ON tmp.subject_id = s.id
      WHERE tmp.status = 'ACTIVE' AND tmp.end_date >= CURDATE()
      ORDER BY tmp.end_date ASC
    `);
    return sendOk(res, rows);
  } catch (err) {
    return sendErr(res, err.message);
  }
};

// GET /api/admin/permissions/expired
exports.getExpired = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT tmp.id, tmp.start_date, tmp.end_date, tmp.status,
             tmp.teacher_id, tmp.module_id, tmp.class_id, tmp.section_id, tmp.subject_id,
             DATEDIFF(tmp.end_date, CURDATE()) AS daysLeft,
             u.name AS teacher,
             m.module_name AS module, m.module_key,
             c.name AS class_name,
             sec.name AS section,
             s.name AS subject
      FROM teacher_module_permissions tmp
      JOIN teachers t  ON tmp.teacher_id  = t.id
      JOIN users    u  ON t.user_id        = u.id
      JOIN modules  m  ON tmp.module_id    = m.id
      LEFT JOIN academic_classes c ON tmp.class_id   = c.id
      LEFT JOIN acad_sections  sec ON tmp.section_id = sec.id
      LEFT JOIN subjects s ON tmp.subject_id = s.id
      WHERE tmp.status = 'EXPIRED' OR tmp.end_date < CURDATE()
      ORDER BY tmp.end_date DESC
    `);
    return sendOk(res, rows);
  } catch (err) {
    return sendErr(res, err.message);
  }
};

// POST /api/admin/permissions/grant
exports.grant = async (req, res) => {
  const { teacher_id, module_id, class_id, section_id, subject_id, start_date, end_date } = req.body;
  if (!teacher_id || !module_id || !start_date || !end_date) {
    return sendErr(res, 'teacher_id, module_id, start_date, end_date required.', 400);
  }
  try {
    const [result] = await pool.execute(`
      INSERT INTO teacher_module_permissions
        (teacher_id, module_id, class_id, section_id, subject_id, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `, [teacher_id, module_id, class_id || null, section_id || null, subject_id || null, start_date, end_date]);
    return sendOk(res, { id: result.insertId }, 'Permission granted.', 201);
  } catch (err) {
    return sendErr(res, err.message);
  }
};

// PUT /api/admin/permissions/:id
exports.update = async (req, res) => {
  const { start_date, end_date, status } = req.body;
  try {
    await pool.execute(`
      UPDATE teacher_module_permissions
      SET start_date = COALESCE(?, start_date),
          end_date   = COALESCE(?, end_date),
          status     = COALESCE(?, status)
      WHERE id = ?
    `, [start_date || null, end_date || null, status || null, req.params.id]);
    return sendOk(res, null, 'Permission updated.');
  } catch (err) {
    return sendErr(res, err.message);
  }
};

// DELETE /api/admin/permissions/:id
exports.remove = async (req, res) => {
  try {
    await pool.execute('DELETE FROM teacher_module_permissions WHERE id = ?', [req.params.id]);
    return sendOk(res, null, 'Permission removed.');
  } catch (err) {
    return sendErr(res, err.message);
  }
};
