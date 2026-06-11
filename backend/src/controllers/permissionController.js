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
<<<<<<< HEAD
  const { teacher_id, module_id, class_id, section_id, subject_id, start_date, end_date } = req.body;
  if (!teacher_id || !module_id || !start_date || !end_date) {
    return sendErr(res, 'teacher_id, module_id, start_date, end_date required.', 400);
  }
  try {
    if (module_id === 'ALL_ACADEMIC' || module_id === 'ALL_FULL') {
      const includeStudents = module_id === 'ALL_FULL';
      // Fetch modules based on the selected bulk mode
      const queryStr = includeStudents 
        ? "SELECT id, module_key FROM modules"
        : "SELECT id, module_key FROM modules WHERE module_key != 'students_management'";
      
      const [modules] = await pool.execute(queryStr);
      
      const values = [];
      const placeholders = [];
      modules.forEach(m => {
        placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
        // SYLLABUS_UPLOAD and students_management are global modules (no class context)
        const isGlobal = m.module_key === 'SYLLABUS_UPLOAD' || m.module_key === 'students_management';
        values.push(
          teacher_id, 
          m.id, 
          isGlobal ? null : (class_id || null), 
          isGlobal ? null : (section_id || null), 
          isGlobal ? null : (subject_id || null), 
          start_date, 
          end_date, 
          'ACTIVE'
        );
      });
=======
  const { 
    teacher_id, 
    module_id, 
    class_id, 
    section_id, 
    subject_id, 
    start_date, 
    end_date,
    teacher_ids,
    scopes,
    subject_ids,
    module_ids
  } = req.body;
>>>>>>> ab32a4a (Added marks management, schedule and syllabus report modules)

  if ((!module_id && (!Array.isArray(module_ids) || module_ids.length === 0)) || !start_date || !end_date) {
    return sendErr(res, 'module selection, start_date, end_date required.', 400);
  }

  // Resolve teacher IDs
  let resolvedTeacherIds = [];
  if (Array.isArray(teacher_ids) && teacher_ids.length > 0) {
    resolvedTeacherIds = teacher_ids.map(Number);
  } else if (teacher_id) {
    resolvedTeacherIds = [Number(teacher_id)];
  } else {
    return sendErr(res, 'At least one teacher must be selected.', 400);
  }

  try {
    // Resolve module IDs
    let resolvedModuleIds = [];
    if (Array.isArray(module_ids) && module_ids.length > 0) {
      resolvedModuleIds = module_ids;
    } else if (module_id) {
      resolvedModuleIds = [module_id];
    }

    let modulesToGrant = [];
    for (const mId of resolvedModuleIds) {
      if (mId === 'ALL_ACADEMIC' || mId === 'ALL_FULL') {
        const includeStudents = mId === 'ALL_FULL';
        const queryStr = includeStudents 
          ? "SELECT id, module_key FROM modules"
          : "SELECT id, module_key FROM modules WHERE module_key != 'students_management'";
        const [dbModules] = await pool.execute(queryStr);
        dbModules.forEach(dbm => {
          if (!modulesToGrant.some(x => String(x.id) === String(dbm.id))) {
            modulesToGrant.push(dbm);
          }
        });
      } else {
        const [dbModules] = await pool.execute("SELECT id, module_key FROM modules WHERE id = ?", [mId]);
        dbModules.forEach(dbm => {
          if (!modulesToGrant.some(x => String(x.id) === String(dbm.id))) {
            modulesToGrant.push(dbm);
          }
        });
      }
    }

    if (modulesToGrant.length === 0) {
      return sendErr(res, 'Invalid module selection.', 400);
    }

    // Resolve scopes
    let resolvedScopes = [];
    if (Array.isArray(scopes) && scopes.length > 0) {
      resolvedScopes = scopes.map(s => ({
        class_id: s.class_id ? Number(s.class_id) : null,
        section_id: s.section_id ? Number(s.section_id) : null
      }));
    } else {
      resolvedScopes = [{
        class_id: class_id ? Number(class_id) : null,
        section_id: section_id ? Number(section_id) : null
      }];
    }

    // Resolve subjects
    let resolvedSubjectIds = [];
    if (Array.isArray(subject_ids) && subject_ids.length > 0) {
      resolvedSubjectIds = subject_ids.map(id => id ? Number(id) : null);
    } else {
      resolvedSubjectIds = [subject_id ? Number(subject_id) : null];
    }

    const values = [];
    const placeholders = [];

    for (const tId of resolvedTeacherIds) {
      for (const m of modulesToGrant) {
        for (const scope of resolvedScopes) {
          for (const subId of resolvedSubjectIds) {
            placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
            values.push(
              tId,
              m.id,
              scope.class_id,
              scope.section_id,
              subId,
              start_date,
              end_date,
              'ACTIVE'
            );
          }
        }
      }
    }

    if (placeholders.length > 0) {
      const query = `
        INSERT INTO teacher_module_permissions
          (teacher_id, module_id, class_id, section_id, subject_id, start_date, end_date, status)
        VALUES ${placeholders.join(', ')}
      `;
      await pool.execute(query, values);
    }

    return sendOk(res, { success: true }, 'Permissions granted successfully.', 201);
  } catch (err) {
    console.error('GRANT ERROR:', err);
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
