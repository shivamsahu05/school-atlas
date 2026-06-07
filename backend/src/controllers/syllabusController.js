// src/controllers/syllabusController.js
const prisma = require('../config/db')
const pool = require('../config/mysqlDb')
const xlsx = require('xlsx')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')
const { calculateDates, sanitize } = require('../utils/syllabusUtils')

const INCLUDE = {
  class: { select: { id: true, class_name: true, section: true } },
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

  const countSql = `
    SELECT COUNT(*) as total FROM syllabus s 
    LEFT JOIN academic_classes ac ON s.class_id = ac.id
    LEFT JOIN acad_sections asec ON s.section_id = asec.id
    WHERE 1=1 ${sql.split('WHERE 1=1')[1].split('ORDER BY')[0]}
  `;
  const [countRes] = await pool.execute(countSql, values.slice(0, -2));
  const total = countRes[0].total;

  const formattedItems = items.map(item => ({
    ...item,
    class: { id: item.class_id, class_name: item.class_name, section: item.section_name },
    subject: { id: item.subject_id, name: item.subject_name },
    teacher: { name: item.teacher_name || '—', id: item.teacher_id }
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
    where: { id: Number(req.params.id) },
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
    chapter, topic, week, month,
    planned_start_date, planned_end_date,
    fromDate, toDate,
    className, sectionName,
    class: classStr, subject: subjectStr,
    completed_date, is_completed, status,
    teacher_id: bodyTeacherId, periods, learning_outcome
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
  const endDate = parseDate(planned_end_date || toDate);
  const compDate = parseDate(completed_date);

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

  // 5. Auto-derive month from dates if not provided
  let finalMonth = month || null;
  if (!finalMonth && startDate) {
    finalMonth = startDate.toLocaleString('default', { month: 'long' });
  }

  // 5. Determine teacher_id: admin can assign to a specific teacher
  const finalTeacherId = (req.user.role === 'admin' && bodyTeacherId)
    ? Number(bodyTeacherId)
    : req.user.id;

  // 6. Insert
  const sql = `
    INSERT INTO syllabus (
      class_id, section_id, subject_id, teacher_id, chapter, topic, week, month,
      planned_start_date, planned_end_date, completed_date, 
      is_completed, status, periods, periods_needed, learning_outcome
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await pool.execute(sql, [
    Number(class_id),
    section_id ? Number(section_id) : null,
    Number(subject_id),
    finalTeacherId,
    chapter || null,
    topic,
    week || null,
    finalMonth,
    startDate,
    endDate,
    compDate,
    is_completed ? 1 : ((status?.toLowerCase() === 'completed') ? 1 : 0),
    (status || (is_completed ? 'completed' : 'pending')).toLowerCase(),
    Number(periods || 0),
    Number(periods || 0),
    learning_outcome || null
  ]);

  return sendSuccess(res, { id: result.insertId }, 'Syllabus item created.', 201)
}

/** PUT /api/syllabus/:id */
/** PUT /api/syllabus/:id */
const updateSyllabus = async (req, res) => {
  const {
    class_id, section_id, subject_id, chapter, topic, week, month,
    planned_start_date, planned_end_date, completed_date, is_completed, status,
    periods, periods_needed, learning_status, notebook_checked, learning_outcome, homework_status, students_data
  } = req.body
  const { id } = req.params

  const updates = []
  const values = []

  if (req.user.role === 'teacher') {
    updates.push('teacher_id=?');
    values.push(req.user.id);
  }

  if (class_id !== undefined) { updates.push('class_id=?'); values.push(class_id ? Number(class_id) : null); }
  if (section_id !== undefined) { updates.push('section_id=?'); values.push(section_id ? Number(section_id) : null); }
  if (subject_id !== undefined) { updates.push('subject_id=?'); values.push(subject_id ? Number(subject_id) : null); }

  if (chapter !== undefined) { updates.push('chapter=?'); values.push(chapter || null); }
  if (topic !== undefined) { updates.push('topic=?'); values.push(topic || null); }
  if (week !== undefined) { updates.push('week=?'); values.push(week || null); }

  // Date Logic for Micro Schedule
  if (month && week && (!planned_start_date || !planned_end_date)) {
    const { startDate, endDate } = calculateDates(month, week);
    updates.push('planned_start_date=?'); values.push(startDate);
    updates.push('planned_end_date=?'); values.push(endDate);
  } else {
    if (planned_start_date !== undefined) { updates.push('planned_start_date=?'); values.push(planned_start_date ? new Date(planned_start_date) : null); }
    if (planned_end_date !== undefined) { updates.push('planned_end_date=?'); values.push(planned_end_date ? new Date(planned_end_date) : null); }
  }

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
    const finalStatus = status.toLowerCase();
    updates.push('status=?');
    values.push(finalStatus);
    // Sync is_completed with status
    if (finalStatus === 'completed') {
      updates.push('is_completed=1');
      if (completed_date === undefined) {
        updates.push('completed_date=NOW()');
      }
    } else {
      updates.push('is_completed=0');
      updates.push('completed_date=NULL');
    }
  }

  if (updates.length === 0) return res.status(400).json({ success: false, message: 'No fields to update' });

  updates.push('updated_at=NOW()');

  let sql = `UPDATE syllabus SET ${updates.join(', ')} WHERE id = ?`;
  values.push(id);

  if (req.user.role === 'teacher') {
    sql += ' AND teacher_id = ?';
    values.push(req.user.id);
  }

  try {
    const [result] = await pool.execute(sql, values);
    if (result.affectedRows === 0) {
      return res.status(403).json({ success: false, message: 'Syllabus item not found or unauthorized.' });
    }
    return res.json({ success: true, message: 'Syllabus updated successfully.' });
  } catch (error) {
    console.error('[UPDATE SYLLABUS ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
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
  const headers = "S.No,Teacher,Class,Section,Subject,Month,Week,No. of Periods,Chapter & Topic,Learning Outcome,Remarks\n";
  const example = "1,Priya Sharma,Class 2,A,Science,May,Week 1 (1-7),5,Power Sharing (Intro),Basic Concept,None\n";
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
    const [teachers] = await pool.execute(`
      SELECT t.id as teacher_id, u.id as user_id, u.name 
      FROM teachers t 
      JOIN users u ON t.user_id = u.id
    `);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        let clsName = String(row.Class || row.class || '').trim();
        if (!clsName && req.body.class_id) {
          const defaultCls = classes.find(c => String(c.id) === String(req.body.class_id));
          if (defaultCls) clsName = defaultCls.name;
        }

        let subName = String(row.Subject || row.subject || '').trim();
        if (!subName && req.body.subject_id) {
          const defaultSub = subjects.find(s => String(s.id) === String(req.body.subject_id));
          if (defaultSub) subName = defaultSub.name;
        }

        let secName = String(row.Section || row.section || '').trim();
        if (!secName && req.body.section_id) {
          const defaultSec = sections.find(s => String(s.id) === String(req.body.section_id));
          if (defaultSec) secName = defaultSec.name;
        }

        const tName = String(row.Teacher || row.teacher || '').trim();
        const month = String(row.Month || row.month || '').trim();
        const week = String(row.Week || row.week || '').trim();
        const topic = String(row['Chapter & Topic'] || row.topic || '').trim();
        const periods = Number(row['No. of Periods'] || row.periods || 0);
        const lo = String(row['Learning Outcome'] || row.learning_outcome || '').trim();

        if (!clsName || !subName || !topic) {
          throw new Error('Missing mandatory fields (Class, Subject, Topic).');
        }

        const cls = classes.find(c => c.name === clsName || c.name.includes(clsName));
        const sub = subjects.find(s => s.name === subName || s.name.includes(subName));
        const sec = sections.find(s => s.name === secName || s.name.includes(secName));

        // Resolve Teacher (by Name or ID)
        let resolvedTeacherId = req.user.id; // Default to admin
        if (tName) {
          const tMatch = teachers.find(t => t.name.toLowerCase() === tName.toLowerCase() || String(t.teacher_id) === tName || String(t.user_id) === tName);
          if (tMatch) resolvedTeacherId = tMatch.user_id;
        } else if (req.body.teacher_id) {
          const tMatch = teachers.find(t => String(t.teacher_id) === String(req.body.teacher_id) || String(t.user_id) === String(req.body.teacher_id));
          if (tMatch) resolvedTeacherId = tMatch.user_id;
        }

        if (!cls) throw new Error(`Class '${clsName}' not found.`);
        if (!sub) throw new Error(`Subject '${subName}' not found.`);

        const { startDate, endDate } = calculateDates(month, week);

        const sql = `
          INSERT INTO syllabus (
            teacher_id, class_id, section_id, subject_id, chapter, week, month, topic, 
            planned_start_date, planned_end_date, periods, periods_needed, learning_outcome, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
          ON DUPLICATE KEY UPDATE
            chapter = VALUES(chapter),
            week = VALUES(week),
            month = VALUES(month),
            planned_start_date = VALUES(planned_start_date),
            planned_end_date = VALUES(planned_end_date),
            periods = VALUES(periods),
            learning_outcome = VALUES(learning_outcome)
        `;

        const [dbRes] = await pool.execute(sql, [
          resolvedTeacherId,
          cls.id,
          sec?.id || null,
          sub.id,
          row.Chapter || null,
          week,
          month,
          topic,
          startDate,
          endDate,
          periods,
          periods,
          lo
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


/** 
 * NEW SYLLABUS PLAN METHODS
 */

/** GET /api/syllabus/plan - PULLS FROM SYLLABUS TABLE (SSOT) */
const getSyllabusPlan = async (req, res) => {
  try {
    let { class_id, section_id, subject_id, month, week, className, section, teacher_id } = req.query;
    const userId = req.user.id;

    let conditions = [];
    let values = [];

    // Force teacher isolation: resolve teacher_id from teachers table
    if (req.user.role === 'teacher') {
      conditions.push('s.teacher_id = ?');
      values.push(userId); // Use user_id (SSOT)
    } else if (teacher_id && teacher_id !== 'All') {
      conditions.push('s.teacher_id = ?');
      values.push(teacher_id);
    }

    if (class_id && class_id !== 'All') {
      conditions.push('s.class_id = ?');
      values.push(class_id);
    }
    if (section_id && section_id !== 'All') {
      conditions.push('s.section_id = ?');
      values.push(section_id);
    }
    if (subject_id && subject_id !== 'All') {
      conditions.push('s.subject_id = ?');
      values.push(subject_id);
    }
    if (month && month !== 'All') {
      // Robust month filtering: try to match either a stored month column OR the month from planned_start_date
      conditions.push('(s.planned_start_date IS NOT NULL AND MONTHNAME(s.planned_start_date) = ?)');
      values.push(month);
    }
    if (week && week !== 'All') {
      conditions.push('s.week = ?');
      values.push(week);
    }

    // Fallback search by strings if needed
    if (className) {
      conditions.push('(ac.class_number = ? OR ac.name = ?)');
      values.push(className, className);
    }
    if (section) {
      conditions.push('(asec.name = ? OR asec.code = ?)');
      values.push(section, section);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        s.*,
        COALESCE(ac.class_number, ac.name) as className,
        asec.name as sectionName,
        sub.name as subjectName,
        u.name as teacherName
      FROM syllabus s
      LEFT JOIN academic_classes ac ON s.class_id = ac.id
      LEFT JOIN acad_sections asec ON s.section_id = asec.id
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      LEFT JOIN users u ON s.teacher_id = u.id
      ${whereClause}
      ORDER BY s.planned_start_date ASC, s.id ASC
    `;

    const [rows] = await pool.execute(query, values);

    // Normalize to the format the frontend expects
    const cleanRows = rows.map(r => ({
      ...r,
      id: r.id,
      syllabus_id: r.id,
      class: r.className || '',
      section: r.sectionName || '',
      subject: r.subjectName || '',
      topic: r.topic || 'Untitled Topic',
      periods: Number(r.periods || 0),
      periods_needed: Number(r.periods_needed || 0),
      status: r.status || (r.is_completed ? 'completed' : 'pending'),
      learning_outcome: r.learning_outcome || '',
      notebook_checked: r.notebook_checked || 'No',
      homework_checked: r.homework_status || 'Incomplete',
      is_completed: Boolean(r.is_completed),
      startDate: r.planned_start_date ? new Date(r.planned_start_date).toISOString().split('T')[0] : null,
      endDate: r.planned_end_date ? new Date(r.planned_end_date).toISOString().split('T')[0] : null,
      month: r.month || (r.planned_start_date ? new Date(r.planned_start_date).toLocaleString('default', { month: 'long' }) : ''),
      teacher: { name: r.teacherName || '—', id: r.teacher_id },
      updatedAt: r.updated_at
    }));

    return res.status(200).json({
      success: true,
      data: cleanRows,
      message: `${cleanRows.length} record(s) found.`
    });

  } catch (error) {
    console.error("[SYLLABUS PLAN ERROR]:", error);
    // Never crash — always return structured JSON
    return res.status(500).json({
      success: false,
      data: [],
      message: "Syllabus plan query failed: " + error.message
    });
  }
}


/** DEBUG /api/syllabus/debug */
const debugSyllabus = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM syllabus_plan');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/** POST /api/syllabus/upload-syllabus */
const uploadSyllabusPlan = async (req, res) => {
  if (!req.file) return sendError(res, 'No file uploaded.', 400);

  try {
    const userId = req.user.id; // Correct teacher_id (SSOT: users.id)
    
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = { inserted: 0, skipped: 0, failed: 0, errors: [] };

    // Prefetch for validation to avoid N+1 queries
    const [classes] = await pool.execute('SELECT id, name, class_number FROM academic_classes');
    const [subjects] = await pool.execute('SELECT id, name FROM subjects');
    const [sections] = await pool.execute('SELECT id, name FROM acad_sections');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      try {
        // --- NORMALIZE INPUTS ---
        const classNameRaw = String(row.Class || row.class || '').trim();
        const sectionRaw = String(row.Section || row.section || '').trim();
        const subjectRaw = String(row.Subject || row.subject || '').trim();
        const monthRaw = String(row.Month || row.month || '').trim();
        const weekRaw = String(row.Week || row.week || '').trim();
        const topic = String(row['Chapter & Topic'] || row.topic || row.chapter_topic || '').trim();
        const periods = Number(row['No. of Periods'] || row.periods || 0);
        const loRaw = String(row['Learning Outcome'] || row.learning_outcome || row.lo || '').trim();

        if (!classNameRaw || !subjectRaw || !topic || !weekRaw || !monthRaw) {
          throw new Error('Missing mandatory fields (Class, Subject, Topic, Week, or Month)');
        }

        // --- RESOLVE IDs ---
        // 1. Resolve Class
        const classClean = classNameRaw.match(/\d+/)?.[0] || classNameRaw;
        const cls = classes.find(c => 
          c.class_number === classClean || 
          c.name.toLowerCase() === classNameRaw.toLowerCase() ||
          c.name.toLowerCase().includes(classNameRaw.toLowerCase())
        );

        // 2. Resolve Subject
        const sub = subjects.find(s => 
          s.name.toLowerCase() === subjectRaw.toLowerCase() ||
          s.name.toLowerCase().includes(subjectRaw.toLowerCase())
        );

        // 3. Resolve Section
        let secId = null;
        if (sectionRaw) {
          const sec = sections.find(s => 
            s.name.toLowerCase() === sectionRaw.toLowerCase() ||
            s.name.toLowerCase().includes(sectionRaw.toLowerCase())
          );
          secId = sec?.id || null;
        }

        if (!cls || !sub) {
          throw new Error(`Could not resolve Class (${classNameRaw}) or Subject (${subjectRaw})`);
        }

        // --- GENERATE DATES ---
        const { startDate, endDate } = calculateDates(monthRaw, weekRaw);

        // --- DUPLICATE CHECK AND UPSERT ---
        const [existing] = await pool.execute(
          'SELECT id FROM syllabus WHERE class_id = ? AND section_id <=> ? AND subject_id = ? AND topic = ? AND LOWER(week) = LOWER(?)',
          [cls.id, secId, sub.id, topic, weekRaw.toLowerCase()]
        );

        if (existing.length > 0) {
          // Update existing record (fixes incorrect teacher_id or other fields)
          await pool.execute(
            `UPDATE syllabus SET 
              teacher_id = ?, 
              periods = ?, 
              periods_needed = ?, 
              learning_outcome = ?, 
              month = ?, 
              week = ?,
              planned_start_date = ?, 
              planned_end_date = ?,
              updated_at = NOW()
            WHERE id = ?`,
            [userId, periods, periods, loRaw, monthRaw, weekRaw, startDate, endDate, existing[0].id]
          );
          results.updated++;
        } else {
          // Insert new record
          await pool.execute(
            `INSERT INTO syllabus (
              class_id, section_id, subject_id, teacher_id, topic, week, month,
              planned_start_date, planned_end_date, periods, periods_needed, learning_outcome, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [cls.id, secId, sub.id, userId, topic, weekRaw, monthRaw, startDate, endDate, periods, periods, loRaw]
          );
          results.inserted++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push({ row: rowNum, error: err.message });
      }
    }

    return res.json({
      success: true,
      message: `Bulk upload completed: ${results.inserted} inserted, ${results.updated} updated, ${results.failed} failed.`,
      data: results
    });
  } catch (error) {
    console.error('[BULK UPLOAD SYLLABUS PLAN ERROR]:', error);
    return sendError(res, 'Failed to process file.', 500);
  }
}

/** POST /api/syllabus/add-micro-schedule */
const addMicroSchedule = async (req, res) => {
  const {
    class_id, section_id, subject_id, topic, week, month, periods, status,
    learning_outcome, notebook_checked
  } = req.body;

  try {
    const userId = req.user.id;

    if (!class_id || !subject_id || !topic || !week || !month) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Normalized Status
    const finalStatus = String(status || 'pending').toLowerCase().trim();

    // 1. Prevent Duplicate (Only for NEW additions)
    const [existing] = await pool.execute(
      'SELECT id FROM syllabus WHERE class_id = ? AND section_id = ? AND subject_id = ? AND topic = ? AND week = ?',
      [class_id, section_id, subject_id, topic, week]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'This topic already exists in the schedule for the selected week.' });
    }

    const { startDate, endDate } = calculateDates(month, week);

    // Determine teacher_id (if admin, find who is assigned, otherwise default to current user)
    let finalTeacherId = userId;
    if (req.user.role === 'admin') {
      const [ttRows] = await pool.execute(`
        SELECT tt.teacher_id 
        FROM teacher_timetable tt
        JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
        LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
        WHERE tt.subject_id = ? AND ac.id = ? AND asec.id = ?
        LIMIT 1
      `, [subject_id, class_id, section_id]);

      if (ttRows.length > 0) {
        finalTeacherId = ttRows[0].teacher_id;
      } else {
        const [tmpRows] = await pool.execute(`
          SELECT t.user_id 
          FROM teacher_module_permissions tmp
          JOIN teachers t ON tmp.teacher_id = t.id
          WHERE tmp.subject_id = ? AND tmp.class_id = ? AND tmp.section_id = ? AND tmp.status = 'ACTIVE'
          LIMIT 1
        `, [subject_id, class_id, section_id]);
        if (tmpRows.length > 0) {
          finalTeacherId = tmpRows[0].user_id;
        }
      }
    }

    // 2. Insert into syllabus (SSOT)
    const [result] = await pool.execute(
      `INSERT INTO syllabus (
        class_id, section_id, subject_id, teacher_id, topic, week, month,
        planned_start_date, planned_end_date, periods, periods_needed, status,
        is_completed, completed_date, learning_outcome, notebook_checked
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        class_id, section_id, subject_id, finalTeacherId, topic, week, month,
        startDate, endDate, Number(periods || 0), Number(periods || 0), finalStatus,
        finalStatus === 'completed' ? 1 : 0,
        finalStatus === 'completed' ? new Date() : null,
        learning_outcome || '', notebook_checked || 'No'
      ]
    );

    return res.json({
      success: true,
      message: 'Micro schedule added successfully.',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('[ADD MICRO SCHEDULE ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}



/** GET /api/syllabus/export-syllabus */
const exportSyllabusPlan = async (req, res) => {
  const { class_id, section_id, subject_id, is_completed } = req.query;

  let sql = `
    SELECT s.*, 
           ac.name as class_name, asec.name as section_name,
           sub.name as subject_name,
           u.name as teacher_name
    FROM syllabus s
    LEFT JOIN academic_classes ac ON s.class_id = ac.id
    LEFT JOIN acad_sections asec ON s.section_id = asec.id
    LEFT JOIN subjects sub ON s.subject_id = sub.id
    LEFT JOIN users u ON s.teacher_id = u.id
    WHERE 1=1
  `;
  const values = [];

  if (class_id) { sql += ' AND s.class_id = ?'; values.push(Number(class_id)); }
  if (section_id) { sql += ' AND s.section_id = ?'; values.push(Number(section_id)); }
  if (subject_id) { sql += ' AND s.subject_id = ?'; values.push(Number(subject_id)); }
  if (is_completed !== undefined && is_completed !== '') {
    sql += ' AND s.is_completed = ?';
    values.push(is_completed === 'true' ? 1 : 0);
  }

  try {
    const [rows] = await pool.execute(sql, values);

    const data = rows.map(r => ({
      'Class': r.class_name || '—',
      'Section': r.section_name || '—',
      'Subject': r.subject_name || '—',
      'Teacher': r.teacher_name || '—',
      'Chapter': r.chapter || 'General',
      'Topic': r.topic || '—',
      'Week': r.week || '—',
      'Month': r.month || (r.planned_start_date ? new Date(r.planned_start_date).toLocaleString('default', { month: 'long' }) : '—'),
      'Planned Start': r.planned_start_date ? new Date(r.planned_start_date).toISOString().split('T')[0] : '—',
      'Planned End': r.planned_end_date ? new Date(r.planned_end_date).toISOString().split('T')[0] : '—',
      'Status': r.is_completed ? 'Completed' : 'Pending',
      'Completion Date': r.completed_date ? new Date(r.completed_date).toISOString().split('T')[0] : '—'
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Syllabus');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=syllabus_export.xlsx');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('[EXPORT SYLLABUS ERROR]:', error);
    return sendError(res, error.message, 500);
  }
}

module.exports = {
  getSyllabus, getSyllabusById, createSyllabus, updateSyllabus, deleteSyllabus,
  getSyllabusMetadata, downloadTemplate, bulkUploadSyllabus,
  getSyllabusPlan, uploadSyllabusPlan, addMicroSchedule, exportSyllabusPlan,
  debugSyllabus
}
