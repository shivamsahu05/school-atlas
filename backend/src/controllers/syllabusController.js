// src/controllers/syllabusController.js
const prisma   = require('../config/db')
const pool     = require('../config/mysqlDb')
const xlsx     = require('xlsx')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const INCLUDE = {
  class:   { select: { id: true, class_name: true, section: true } },
  subject: { select: { id: true, name: true } },
}

/** GET /api/syllabus?class_id=&subject_id=&is_completed=&month= */
const getSyllabus = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { class_id, section_id, subject_id, is_completed, search, teacher_id, className, section, month } = req.query

  let sql = `
    SELECT s.*, 
           ac.name as class_name, asec.name as section_name,
           sub.name as subject_name,
           COALESCE(u_direct.name, u_match.name, u_sub.name) as teacher_name,
           COALESCE(tpl.principal_score, s.learning_outcome) as lo_score
    FROM syllabus s
    LEFT JOIN academic_classes ac ON s.class_id = ac.id
    LEFT JOIN acad_sections asec ON s.section_id = asec.id
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    
    -- Strategy 1: Direct ID
    LEFT JOIN users u_direct ON s.teacher_id = u_direct.id
    
    -- Strategy 2: Subject/Class match
    LEFT JOIN users u_match ON u_match.id = (
      SELECT ts2.teacher_id FROM teacher_subjects ts2
      JOIN classes c2 ON ts2.class_id = c2.id
      WHERE ts2.subject_id = s.subject_id
      AND (ac.name LIKE CONCAT('%', c2.class_name, '%') OR c2.class_name LIKE CONCAT('%', ac.name, '%'))
      LIMIT 1
    )

    -- Strategy 3: Subject only fallback
    LEFT JOIN users u_sub ON u_sub.id = (
      SELECT ts3.teacher_id FROM teacher_subjects ts3
      WHERE ts3.subject_id = s.subject_id
      LIMIT 1
    )

    -- JOIN with LO scores
    LEFT JOIN teacher_performance_lo tpl ON (
      tpl.subject_id = s.subject_id
      AND tpl.topic = s.topic
      AND tpl.teacher_id IN (
        SELECT t_inner.id FROM teachers t_inner 
        WHERE t_inner.user_id = COALESCE(u_direct.id, u_match.id, u_sub.id)
        OR t_inner.id = COALESCE(u_direct.id, u_match.id, u_sub.id)
      )
    )
    WHERE 1=1
  `;

  const values = [];
  if (class_id) { sql += ' AND s.class_id = ?'; values.push(Number(class_id)); }
  if (section_id) { sql += ' AND s.section_id = ?'; values.push(Number(section_id)); }
  if (className) { sql += ' AND ac.class_number = ?'; values.push(className); }
  if (section) { sql += ' AND asec.name = ?'; values.push(section); }
  if (subject_id) { sql += ' AND s.subject_id = ?'; values.push(Number(subject_id)); }
  if (is_completed !== undefined) { 
    sql += ' AND s.is_completed = ?'; 
    values.push(is_completed === 'true' ? 1 : 0); 
  } else if (req.query.status) {
    sql += ' AND s.status = ?';
    values.push(req.query.status);
  }
  if (search) { sql += ' AND s.topic LIKE ?'; values.push(`%${search}%`); }
  if (month && month !== 'All') { sql += ' AND MONTHNAME(s.planned_start_date) = ?'; values.push(month); }
  
  if (teacher_id) {
    const tId = Number(teacher_id);
    sql += ' AND (u_direct.id = ? OR u_match.id = ? OR u_sub.id = ?)';
    values.push(tId, tId, tId);
  }

  // MANDATORY SECURITY: If teacher, isolation is forced
  if (req.user.role === 'teacher') {
    sql += ' AND s.teacher_id = ?';
    values.push(req.user.id);
  }

  sql += ' ORDER BY s.planned_start_date ASC LIMIT ? OFFSET ?';
  values.push(take, skip);

  const [items] = await pool.execute(sql, values);
  
  // Debug logs for verification
  if (req.user.role === 'teacher') {
    console.log(`[SYLLABUS] Fetching for teacher ID: ${req.user.id}. Found ${items.length} items.`);
  }

  const [countRes] = await pool.execute('SELECT COUNT(*) as total FROM syllabus');
  const total = countRes[0].total;

  const formattedItems = items.map(item => ({
    ...item,
    class: { id: item.class_id, class_name: item.class_name, section: item.section_name },
    subject: { id: item.subject_id, name: item.subject_name },
    teacher: { name: item.teacher_name || '—' }
  }));

  const statsSql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN s.is_completed = 1 THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN s.is_completed = 0 THEN 1 ELSE 0 END) as pending
    FROM syllabus s
    LEFT JOIN academic_classes ac ON s.class_id = ac.id
    LEFT JOIN acad_sections asec ON s.section_id = asec.id
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    
    -- Strategy 1: Direct ID
    LEFT JOIN users u_direct ON s.teacher_id = u_direct.id
    
    -- Strategy 2: Subject/Class match
    LEFT JOIN users u_match ON u_match.id = (
      SELECT ts2.teacher_id FROM teacher_subjects ts2
      JOIN classes c2 ON ts2.class_id = c2.id
      WHERE ts2.subject_id = s.subject_id
      AND (ac.name LIKE CONCAT('%', c2.class_name, '%') OR c2.class_name LIKE CONCAT('%', ac.name, '%'))
      LIMIT 1
    )

    -- Strategy 3: Subject only fallback
    LEFT JOIN users u_sub ON u_sub.id = (
      SELECT ts3.teacher_id FROM teacher_subjects ts3
      WHERE ts3.subject_id = s.subject_id
      LIMIT 1
    )
    WHERE 1=1
  ` + sql.split('WHERE 1=1')[1].split('ORDER BY')[0];

  const statsValues = values.slice(0, -2); // Remove take and skip

  const [statsRows] = await pool.execute(statsSql, statsValues);
  
  const s = statsRows[0];
  const totalItems = Number(s.total) || 0;
  const completedItems = Number(s.completed) || 0;
  const pendingItems = Number(s.pending) || 0;
  const completionPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return sendSuccess(res, {
    ...paginated(formattedItems, total, page, limit),
    stats: { 
      total: totalItems, 
      completed: completedItems, 
      pending: pendingItems, 
      completionPct 
    },
  })
}

/** 
 * GET /api/syllabus/metadata?class_id=&subject_id=
 * Fetches distinct months and weeks for the dropdowns.
 */
const getSyllabusMetadata = async (req, res) => {
  const { class_id, subject_id } = req.query;
  if (!class_id || !subject_id) return sendError(res, 'class_id and subject_id are required.', 400);

  try {
    const [rows] = await pool.execute(`
      SELECT DISTINCT 
        MONTHNAME(planned_start_date) as month,
        week,
        topic,
        planned_start_date
      FROM syllabus
      WHERE class_id = ? AND subject_id = ?
      ${req.user.role === 'teacher' ? 'AND teacher_id = ?' : ''}
      ORDER BY planned_start_date ASC
    `, req.user.role === 'teacher' ? [class_id, subject_id, req.user.id] : [class_id, subject_id]);

    const months = [...new Set(rows.map(r => r.month))].filter(Boolean);
    
    return sendSuccess(res, {
      months,
      syllabus: rows // Full rows to help frontend map weeks to dates
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
}

/** GET /api/syllabus/:id */
const getSyllabusById = async (req, res) => {
  const item = await prisma.syllabus.findUnique({
    where:   { id: Number(req.params.id) },
    include: INCLUDE,
  })
  if (!item) return sendError(res, 'Syllabus item not found.', 404)
  
  // Ownership check
  if (req.user.role === 'teacher' && item.teacher_id !== req.user.id) {
    return sendError(res, 'Unauthorized access to this syllabus item.', 403)
  }
  
  return sendSuccess(res, item)
}

/** POST /api/syllabus */
const createSyllabus = async (req, res) => {
  let { 
    class_id, section_id, subject_id, 
    chapter, topic, week,
    planned_start_date, planned_end_date,
    fromDate, toDate,
    className, sectionName,
    class: classStr, subject: subjectStr,
    completed_date, is_completed, status
  } = req.body

  // 1. Resolve Dates (Handle DD/MM/YYYY)
  const parseDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return d;
    // Check for DD/MM/YYYY
    if (typeof d === 'string' && d.includes('/')) {
      const [day, month, year] = d.split('/');
      return new Date(`${year}-${month}-${day}`);
    }
    const parsed = new Date(d);
    return isNaN(parsed) ? null : parsed;
  }

  const startDate = parseDate(planned_start_date || fromDate);
  const endDate   = parseDate(planned_end_date || toDate);
  const compDate  = parseDate(completed_date);

  // 2. Resolve IDs from Strings if missing
  // Handle "Class 1 - A"
  if (!class_id && classStr) {
    const match = classStr.match(/Class\s*(\d+)\s*-\s*([A-Za-z])/i);
    if (match) {
      className = match[1];
      sectionName = match[2];
    }
  }

  if (!class_id && className) {
    const [rows] = await pool.execute('SELECT id FROM academic_classes WHERE class_number = ? OR name = ?', [className, className]);
    if (rows.length > 0) class_id = rows[0].id;
  }

  if (!section_id && sectionName) {
    const [rows] = await pool.execute('SELECT id FROM acad_sections WHERE name LIKE ? OR code = ?', [`%${sectionName}%`, sectionName]);
    if (rows.length > 0) section_id = rows[0].id;
  }

  if (!subject_id && subjectStr) {
    const [rows] = await pool.execute('SELECT id FROM subjects WHERE name = ?', [subjectStr]);
    if (rows.length > 0) subject_id = rows[0].id;
  }

  // 3. Validation
  if (!class_id || !subject_id) {
    return sendError(res, `Missing mapping: Class ID (${class_id}) or Subject ID (${subject_id}) could not be resolved.`, 400);
  }

  // 4. Granular Permission Check
  if (req.user.role === 'teacher') {
    const [teacherRows] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (teacherRows.length === 0) return sendError(res, 'Teacher profile not found.', 403);
    const teacherId = teacherRows[0].id;

    const [permRows] = await pool.execute(`
      SELECT id FROM teacher_module_permissions 
      WHERE teacher_id = ? AND module_id = (SELECT id FROM modules WHERE module_key = 'SYLLABUS_UPLOAD')
      AND class_id = ? AND (subject_id = ? OR subject_id IS NULL)
      AND status = 'ACTIVE' AND CURDATE() BETWEEN start_date AND end_date
    `, [teacherId, class_id, subject_id]);

    if (permRows.length === 0) {
      return sendError(res, 'You do not have permission to upload syllabus for this specific class/subject.', 403);
    }
  }

  // 5. Insert
  const sql = `
    INSERT INTO syllabus (
      class_id, section_id, subject_id, teacher_id, chapter, topic, week,
      planned_start_date, planned_end_date, completed_date, 
      is_completed, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const [result] = await pool.execute(sql, [
    Number(class_id),
    section_id ? Number(section_id) : null,
    Number(subject_id),
    req.user.id,
    chapter || null,
    topic,
    week || null,
    startDate,
    endDate,
    compDate,
    is_completed ? 1 : (status === 'completed' ? 1 : 0),
    status || (is_completed ? 'completed' : 'pending')
  ]);

  return sendSuccess(res, { id: result.insertId }, 'Syllabus item created.', 201)
}

/** PUT /api/syllabus/:id */
const updateSyllabus = async (req, res) => {
  const { 
    chapter, topic, section_id, planned_start_date, planned_end_date, completed_date, is_completed, status,
    periods, periods_needed, learning_status, notebook_checked, learning_outcome, homework_status, students_data
  } = req.body
  const { id } = req.params

  const updates = []
  const values = []
  
  if (req.user.role === 'teacher') {
    updates.push('teacher_id=?');
    values.push(req.user.id);
  }

  if (chapter !== undefined) { updates.push('chapter=?'); values.push(chapter || null); }
  if (topic !== undefined) { updates.push('topic=?'); values.push(topic || null); }
  if (req.body.week !== undefined) { updates.push('week=?'); values.push(req.body.week || null); }
  if (section_id !== undefined) { updates.push('section_id=?'); values.push(section_id ? Number(section_id) : null); }
  if (planned_start_date !== undefined) { updates.push('planned_start_date=?'); values.push(planned_start_date ? new Date(planned_start_date) : null); }
  if (planned_end_date !== undefined) { updates.push('planned_end_date=?'); values.push(planned_end_date ? new Date(planned_end_date) : null); }
  if (completed_date !== undefined) { updates.push('completed_date=?'); values.push(completed_date ? new Date(completed_date) : null); }
  
  // Tracking fields
  if (periods !== undefined) { updates.push('periods=?'); values.push(Number(periods) || 0); }
  if (periods_needed !== undefined) { updates.push('periods_needed=?'); values.push(Number(periods_needed) || 0); }
  if (learning_status !== undefined) { updates.push('learning_status=?'); values.push(learning_status); }
  if (notebook_checked !== undefined) { updates.push('notebook_checked=?'); values.push(notebook_checked); }
  if (learning_outcome !== undefined) { updates.push('learning_outcome=?'); values.push(learning_outcome); }
  if (homework_status !== undefined) { updates.push('homework_status=?'); values.push(homework_status); }
  if (students_data !== undefined) { updates.push('students_data=?'); values.push(JSON.stringify(students_data)); }

  if (status !== undefined) {
    updates.push('status=?');
    values.push(status);
    // Sync is_completed with status
    if (status === 'completed') {
      updates.push('is_completed=1');
      if (completed_date === undefined) updates.push('completed_date=NOW()');
    } else {
      updates.push('is_completed=0');
      if (completed_date === undefined) updates.push('completed_date=NULL');
    }
  } else if (is_completed !== undefined) {
    console.log(`[SYLLABUS UPDATE] ID: ${id}, New IsCompleted: ${is_completed}`);
    updates.push('is_completed=?');
    values.push(is_completed ? 1 : 0);
    updates.push('status=?');
    values.push(is_completed ? 'completed' : 'pending');
    if (is_completed && completed_date === undefined) {
      updates.push('completed_date=NOW()');
    } else if (!is_completed && completed_date === undefined) {
      updates.push('completed_date=NULL');
    }
  }

  if (updates.length === 0) return sendSuccess(res, null, 'No changes made.');

  let sql = `UPDATE syllabus SET ${updates.join(', ')}, updated_at=NOW() WHERE id=?`;
  values.push(id);

  if (req.user.role === 'teacher') {
    sql += ' AND teacher_id = ?';
    values.push(req.user.id);
  }

  const [result] = await pool.execute(sql, values);
  if (result.affectedRows === 0) {
    return sendError(res, 'Syllabus item not found or unauthorized.', 403);
  }

  return sendSuccess(res, null, 'Syllabus item updated.')
}

const deleteSyllabus = async (req, res) => {
  const { id } = req.params;
  
  if (req.user.role === 'teacher') {
    const [result] = await pool.execute('DELETE FROM syllabus WHERE id = ? AND teacher_id = ?', [id, req.user.id]);
    if (result.affectedRows === 0) return sendError(res, 'Syllabus item not found or unauthorized.', 403);
  } else {
    await pool.execute('DELETE FROM syllabus WHERE id = ?', [id]);
  }
  
  return sendSuccess(res, null, 'Syllabus item deleted.')
}

/** GET /api/syllabus/template */
const downloadTemplate = async (req, res) => {
  const headers = "Class,Section,Subject,Chapter,Week,Topic,StartDate,EndDate\n";
  const example = "Class 2,A,Science,Chapter 1,Week 1,Introduction,2026-04-01,2026-04-05\n";
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=syllabus_template.csv');
  return res.status(200).send(headers + example);
}

/** POST /api/syllabus/bulk-upload */
const bulkUploadSyllabus = async (req, res) => {
  if (!req.file) return sendError(res, 'No file uploaded.', 400);

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`[BULK SYLLABUS] Received ${rows.length} rows.`);

    const results = { inserted: 0, updated: 0, failed: 0, errors: [] };

    // Prefetch for validation
    const [classes] = await pool.execute('SELECT id, name FROM academic_classes');
    const [subjects] = await pool.execute('SELECT id, name FROM subjects');
    const [sections] = await pool.execute('SELECT id, name FROM acad_sections');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const cls = classes.find(c => c.name === String(row.Class || row.class));
        const sub = subjects.find(s => s.name === String(row.Subject || row.subject));
        const sec = sections.find(s => s.name === String(row.Section || row.section));

        if (!cls) throw new Error(`Class '${row.Class}' not found.`);
        if (!sub) throw new Error(`Subject '${row.Subject}' not found.`);
        if (!row.Topic && !row.topic) throw new Error('Topic is required.');

        // Permission check for teacher
        if (req.user.role === 'teacher') {
          const [teacherRows] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
          const teacherId = teacherRows[0]?.id;
          const [permRows] = await pool.execute(`
            SELECT id FROM teacher_module_permissions 
            WHERE teacher_id = ? AND module_id = (SELECT id FROM modules WHERE module_key = 'SYLLABUS_UPLOAD')
            AND class_id = ? AND (subject_id = ? OR subject_id IS NULL)
            AND status = 'ACTIVE'
          `, [teacherId, cls.id, sub.id]);

          if (permRows.length === 0) throw new Error('Unauthorized for this class/subject.');
        }

        const startDate = row.StartDate || row.startDate ? new Date(row.StartDate || row.startDate) : null;
        const endDate = row.EndDate || row.endDate ? new Date(row.EndDate || row.endDate) : null;

        const sql = `
          INSERT INTO syllabus (
            teacher_id, class_id, section_id, subject_id, chapter, week, topic, planned_start_date, planned_end_date, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          ON DUPLICATE KEY UPDATE
            chapter = VALUES(chapter),
            planned_start_date = VALUES(planned_start_date),
            planned_end_date = VALUES(planned_end_date),
            teacher_id = VALUES(teacher_id)
        `;

        const [dbRes] = await pool.execute(sql, [
          req.user.id,
          cls.id,
          sec?.id || null,
          sub.id,
          row.Chapter || row.chapter || null,
          row.Week || row.week || null,
          row.Topic || row.topic,
          startDate,
          endDate
        ]);

        if (dbRes.affectedRows === 1) results.inserted++;
        else results.updated++;

      } catch (err) {
        results.failed++;
        results.errors.push({ row: rowNum, error: err.message });
      }
    }

    return sendSuccess(res, results, 'Bulk upload completed.');
  } catch (error) {
    console.error('[BULK SYLLABUS ERROR]:', error);
    return sendError(res, 'Failed to process file.', 500);
  }
}

module.exports = { 
  getSyllabus, getSyllabusById, createSyllabus, updateSyllabus, deleteSyllabus, 
  getSyllabusMetadata, downloadTemplate, bulkUploadSyllabus 
}
