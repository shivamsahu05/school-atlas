const pool = require('../config/mysqlDb');

/**
 * GET /api/admin/lo/meta
 */
exports.getLOMeta = async (req, res) => {
  console.log('[LO META] Fetching metadata...');
  try {
    // 1. Classes (Academic Structure)
    const [classes] = await pool.query('SELECT id, name as class_name FROM academic_classes ORDER BY sort_order');

    // 2. All Subjects (FIX: No is_deleted column)
    const [subjects] = await pool.query('SELECT id, name FROM subjects ORDER BY name');

    // 3. Teachers (Join with users, use is_deleted safely)
    const [teachers] = await pool.query(`
      SELECT t.id, u.name 
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_deleted = 0
      ORDER BY u.name
    `);

    // 4. Learning Outcomes (FIX: Check if table exists/has columns)
    // Using a fallback to empty array to prevent 500 errors
    let learningOutcomes = [];
    try {
      const [loRows] = await pool.query('SELECT id, topic as title FROM learning_outcomes');
      learningOutcomes = loRows || [];
    } catch (e) {
      console.warn('[LO META] learning_outcomes table check failed, returning empty.');
    }

    return res.status(200).json({
      success: true,
      data: {
        classes: classes || [],
        subjects: subjects || [],
        teachers: teachers || [],
        learning_outcomes: learningOutcomes
      }
    });
  } catch (error) {
    console.error('[LO META ERROR]:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to load LO metadata: ' + error.message 
    });
  }
};

/**
 * GET /api/admin/lo/subjects/:classId
 * Returns subjects assigned to a specific class via acad_class_subjects
 */
exports.getSubjectsByClass = async (req, res) => {
    const { classId } = req.params;
    try {
        // Use mapping table if available, else fallback to all subjects
        const [rows] = await pool.query(`
            SELECT DISTINCT s.id, s.name 
            FROM subjects s
            JOIN acad_class_subjects acs ON s.id = acs.subject_id
            WHERE acs.class_id = ?
            ORDER BY s.name
        `, [classId]);

        // If no mappings found, return all subjects to prevent empty dropdowns
        if (rows.length === 0) {
            const [allSubjects] = await pool.query('SELECT id, name FROM subjects ORDER BY name');
            return res.json({ success: true, data: allSubjects });
        }

        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[LO SUBJECTS ERROR]:', error);
        // Fallback to all subjects on error
        const [allSubjects] = await pool.query('SELECT id, name FROM subjects ORDER BY name');
        return res.json({ success: true, data: allSubjects });
    }
};

/**
 * GET /api/admin/lo/teachers/:classId/:subjectId
 * Returns teachers assigned to a specific class and subject
 */
exports.getTeachersByClassSubject = async (req, res) => {
    const { classId, subjectId } = req.params;
    try {
        // Try strict mapping first
        const [rows] = await pool.query(`
            SELECT DISTINCT t.id, u.name 
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            JOIN teacher_subjects ts ON t.id = ts.teacher_id
            WHERE ts.class_id = ? AND ts.subject_id = ?
            ORDER BY u.name
        `, [classId, subjectId]);

        // If no mappings found, fallback to all teachers to keep the UI usable
        if (rows.length === 0) {
            const [allTeachers] = await pool.query(`
                SELECT t.id, u.name FROM teachers t JOIN users u ON t.user_id = u.id WHERE t.is_deleted = 0 ORDER BY u.name
            `);
            return res.json({ success: true, data: allTeachers });
        }

        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('[LO TEACHERS ERROR]:', error);
        // Fallback to all teachers
        const [allTeachers] = await pool.query(`
            SELECT t.id, u.name FROM teachers t JOIN users u ON t.user_id = u.id WHERE t.is_deleted = 0 ORDER BY u.name
        `);
        return res.json({ success: true, data: allTeachers });
    }
};

/**
 * POST /api/admin/lo/award
 */
exports.awardLOScore = async (req, res) => {
  let { teacher_id, class_id, subject_id, month, week, topic, score, className, sectionName } = req.body;
  
  // Resolve legacy class_id from className and sectionName if provided
  if (className && sectionName) {
    const [clsRows] = await pool.query(
      'SELECT id FROM classes WHERE class_name = ? AND section = ?',
      [className, sectionName]
    );
    if (clsRows.length > 0) {
      class_id = clsRows[0].id;
    } else {
      // Create legacy class record if missing
      const [newCls] = await pool.query(
        'INSERT INTO classes (class_name, section) VALUES (?, ?)',
        [className, sectionName]
      );
      class_id = newCls.insertId;
    }
  }

  if (!teacher_id || !class_id || !subject_id || !month || !week || !topic || score === undefined) {
    return res.status(400).json({ success: false, message: 'All fields are required (Class, Section, Subject, Teacher, Topic, Score)' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO teacher_performance_lo 
      (teacher_id, class_id, subject_id, month, week, topic, principal_score, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'AWARDED')`,
      [teacher_id, class_id, subject_id, month, week, topic, score]
    );

    return res.status(200).json({
      success: true,
      message: 'Learning Outcome score awarded successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('[LO AWARD ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/lo/history
 */
exports.getLOHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        tp.id, tp.teacher_id, tp.class_id, tp.subject_id, tp.month, tp.week, tp.topic, 
        COALESCE(tp.principal_score, 0) as score,
        COALESCE(tp.teacher_score, 0) as teacher_score,
        COALESCE(tp.principal_score, 0) as principal_score,
        tp.status, tp.created_at,
        COALESCE(u.name, 'Unknown') as teacher_name,
        COALESCE(c_legacy.class_name, c_acad.name, 'Unknown Class') as class_name,
        COALESCE(c_legacy.section, '') as section,
        COALESCE(s.name, 'Unknown') as subject_name
      FROM teacher_performance_lo tp
      LEFT JOIN teachers t ON tp.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classes c_legacy ON tp.class_id = c_legacy.id
      LEFT JOIN academic_classes c_acad ON tp.class_id = c_acad.id
      LEFT JOIN subjects s ON tp.subject_id = s.id
      ORDER BY tp.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[LO HISTORY ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/lo/update/:id
 */
exports.updateLOScore = async (req, res) => {
  const { id } = req.params;
  const { score, topic, month, week } = req.body;
  
  try {
    await pool.query(
      `UPDATE teacher_performance_lo 
       SET principal_score = ?, topic = ?, month = ?, week = ?
       WHERE id = ?`,
      [score, topic, month, week, id]
    );
    return res.json({ success: true, message: 'Score updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/lo/delete/:id
 */
exports.deleteLOScore = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM teacher_performance_lo WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Score deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
