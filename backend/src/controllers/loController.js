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
  let { teacher_id, class_id, subject_id, month, week, topic, score, lo_status, className, sectionName } = req.body;
  
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
      (teacher_id, class_id, subject_id, month, week, topic, principal_score, lo_status, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AWARDED')`,
      [teacher_id, class_id, subject_id, month, week, topic, score, lo_status || 'Meeting']
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
        tp.lo_status,
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
  const { score, topic, month, week, lo_status } = req.body;
  
  try {
    await pool.query(
      `UPDATE teacher_performance_lo 
       SET principal_score = ?, topic = ?, month = ?, week = ?, lo_status = ?
       WHERE id = ?`,
      [score, topic, month, week, lo_status || 'Meeting', id]
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

/**
 * GET /api/admin/lo/resolve-topic
 */
exports.getResolvedTopic = async (req, res) => {
  const { teacher_id, class_id, section_id, subject_id, month, week } = req.query;
  console.log('[RESOLVE TOPIC] Params:', { teacher_id, class_id, section_id, subject_id, month, week });
  
  try {
    // 0. Resolve the USER ID from the TEACHER ID (syllabus table uses user_id)
    const [teacherRows] = await pool.query('SELECT user_id FROM teachers WHERE id = ?', [teacher_id]);
    if (teacherRows.length === 0) return res.json({ success: true, topic: null });
    const userId = teacherRows[0].user_id;

    // 1. Get the subject name for the selected subject_id
    const [subjectRows] = await pool.query('SELECT name FROM subjects WHERE id = ?', [subject_id]);
    const subjectName = subjectRows.length > 0 ? subjectRows[0].name : '';
    const cleanSubName = subjectName.toLowerCase().replace('mathematics', 'math').replace('maths', 'math').trim();

    // 2. Search with strict matching first, then fallback
    const [rows] = await pool.query(`
      SELECT s.topic 
      FROM syllabus s
      JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.teacher_id = ? 
      AND s.class_id = ? 
      AND s.section_id = ? 
      AND (
        sub.id = ? 
        OR LOWER(sub.name) LIKE ? 
        OR ( ? != '' AND REPLACE(REPLACE(LOWER(sub.name), 'mathematics', 'math'), 'maths', 'math') LIKE ? )
      )
      AND (
        -- Option 1: Exact Month + Exact Week
        (LOWER(s.month) = LOWER(?) AND REPLACE(LOWER(s.week), ' ', '') = REPLACE(LOWER(?), ' ', ''))
        
        OR
        
        -- Option 2: Week column contains "Month Week" (e.g. "May Week 3")
        (REPLACE(LOWER(s.week), ' ', '') = REPLACE(LOWER(CONCAT(?, ?)), ' ', ''))
        
        OR
        
        -- Option 3: Month is NULL but Week column is an exact match (for older records)
        ((s.month IS NULL OR s.month = '') AND REPLACE(LOWER(s.week), ' ', '') = REPLACE(LOWER(?), ' ', ''))
      )
      ORDER BY s.created_at DESC
      LIMIT 1
    `, [
      userId, class_id, section_id, 
      subject_id, `%${subjectName}%`, 
      cleanSubName, `%${cleanSubName}%`,
      month, week, 
      month, week, 
      week
    ]);

    console.log('[RESOLVE TOPIC] Found:', rows.length > 0 ? rows[0].topic : 'None');

    if (rows.length > 0) {
      return res.json({ success: true, topic: rows[0].topic });
    }
    return res.json({ success: true, topic: null });
  } catch (error) {
    console.error('[RESOLVE TOPIC ERROR]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/lo/teacher
 * Modern Academic Intelligence Dashboard Data for Teachers
 */
exports.getTeacherLOAnalytics = async (req, res) => {
  const userId = req.user?.id;
  const { class_id, section_id, subject_id } = req.query;

  console.log(`[LO ANALYTICS] Request by User: ${userId}`, { class_id, section_id, subject_id });

  try {
    // 1. Resolve Teacher ID from User ID
    if (!userId) {
      console.warn('[LO ANALYTICS] Missing User ID in request');
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    const [tRows] = await pool.query("SELECT id FROM teachers WHERE user_id = ?", [userId]);
    if (!tRows || tRows.length === 0) {
      console.warn(`[LO ANALYTICS] Teacher profile not found for User: ${userId}`);
      return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    }
    const teacherId = tRows[0].id;

    // 2. Fetch Class Sizes for accurate percentage calculation
    const [classCounts] = await pool.query(`
      SELECT class_id, section_id, COUNT(*) as total_students 
      FROM students 
      WHERE status = 'Active' 
      GROUP BY class_id, section_id
    `);
    const classSizes = {};
    classCounts.forEach(c => {
      classSizes[`${c.class_id}_${c.section_id}`] = c.total_students;
    });

    // 3. Base Query for Syllabus (Student-level LO Source)
    // Syllabus stores users.id in teacher_id column
    let filterSql = "WHERE s.teacher_id = ?";
    let params = [userId];

    if (class_id && class_id !== 'undefined' && class_id !== 'null' && class_id !== '') { 
      filterSql += " AND s.class_id = ?"; 
      params.push(Number(class_id)); 
    }
    if (section_id && section_id !== 'undefined' && section_id !== 'null' && section_id !== '') { 
      filterSql += " AND s.section_id = ?"; 
      params.push(Number(section_id)); 
    }
    if (subject_id && subject_id !== 'undefined' && subject_id !== 'null' && subject_id !== '') { 
      filterSql += " AND s.subject_id = ?"; 
      params.push(Number(subject_id)); 
    }

    // Only show topics that are actually being worked on or completed
    filterSql += " AND s.status != 'pending'";

    const [syllabusRows] = await pool.query(`
      SELECT 
        s.id, s.topic, s.week, s.month, s.students_data, s.is_completed, s.status,
        ac.name as class_name, asec.name as section_name, sub.name as subject_name,
        s.class_id, s.section_id, s.subject_id,
        s.learning_outcome, s.class_understanding_level
      FROM syllabus s
      LEFT JOIN academic_classes ac ON s.class_id = ac.id
      LEFT JOIN acad_sections asec ON s.section_id = asec.id
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      ${filterSql}
      ORDER BY 
        CASE s.month
          WHEN 'April' THEN 1 WHEN 'May' THEN 2 WHEN 'June' THEN 3 WHEN 'July' THEN 4
          WHEN 'August' THEN 5 WHEN 'September' THEN 6 WHEN 'October' THEN 7 WHEN 'November' THEN 8
          WHEN 'December' THEN 9 WHEN 'January' THEN 10 WHEN 'February' THEN 11 WHEN 'March' THEN 12
          ELSE 13
        END,
        s.week ASC
    `, params);

    const [trackingRows] = await pool.query(`
      SELECT mss.*, std.name, std.roll_no, s.topic, s.class_id, s.subject_id
      FROM micro_schedule_student_status mss
      JOIN students std ON mss.student_id = std.id
      JOIN syllabus s ON mss.syllabus_id = s.id
      WHERE s.teacher_id = ? 
        AND (mss.homework_completed = 0 OR mss.notebook_checked = 0)
    `, [userId]);



    // 3. Process Analytics
    const timeline = {};
    const studentDefaults = {}; // student_id -> { name, roll, count, contact }
    let totalWeeks = 0;
    let perfectWeeks = 0;
    let totalDefaulters = 0;

    (syllabusRows || []).forEach(row => {
      // Normalize month to Title Case to match frontend chips
      let month = row.month || 'Unplanned';
      if (month !== 'Unplanned') {
        month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
      }
      
      if (!timeline[month]) timeline[month] = [];

      let students = [];
      try {
        if (row.students_data) {
          students = typeof row.students_data === 'string' ? JSON.parse(row.students_data) : row.students_data;
        }
      } catch (e) { 
        console.error(`[LO ANALYTICS] JSON Parse Error for Row ID ${row.id}`);
        students = []; 
      }

      if (!Array.isArray(students)) students = [];

      // Combine Syllabus LO Approaching students + Micro-Schedule NOT_COMPLETED students
      const loMissing = students.filter(s => {
        const lvl = String(s?.learning_status || '').toLowerCase();
        const hw = String(s?.homework || s?.homework_status || '').toLowerCase();
        const nb = String(s?.notebook_checked || s?.notebook || '').toLowerCase();

        return (
          lvl.includes('approach') || 
          hw.includes('incomplete') || hw.includes('pending') || hw === 'no' || hw === 'false' ||
          nb === 'no' || nb === 'false' || nb.includes('incomplete') || nb.includes('pending')
        );
      });

      const microMissing = (trackingRows || []).filter(tr => 
        tr.topic === row.topic && 
        Number(tr.class_id || 0) === Number(row.class_id || 0) && 
        Number(tr.subject_id || 0) === Number(row.subject_id || 0)
      );

      // Create a unique set of missing students
      const combinedMissingMap = new Map();
      loMissing.forEach(s => {
        const sid = s.id || s.student_id;
        if (sid) {
          const hw = String(s?.homework || s?.homework_status || '').toLowerCase();
          const nb = String(s?.notebook_checked || s?.notebook || '').toLowerCase();
          let reason = 'LO Pending';
          if (hw.includes('incomplete') || hw.includes('pending') || hw === 'false' || hw === 'no') reason = 'Homework Pending';
          else if (nb === 'no' || nb === 'false' || nb.includes('incomplete') || nb.includes('pending')) reason = 'Notebook Pending';

          combinedMissingMap.set(Number(sid), { 
            name: s.name || 'Unknown Student', 
            roll_no: s.roll_no || s.rollNumber || 'N/A', 
            reason: reason
          });
        }
      });

      microMissing.forEach(s => {
        const sid = Number(s.student_id);
        if (sid) {
          const existing = combinedMissingMap.get(sid);
          if (existing) {
            existing.reason = 'Multiple Gaps';
          } else {
            combinedMissingMap.set(sid, { 
              name: s.name || 'Unknown Student', 
              roll_no: s.roll_no || 'N/A', 
              reason: 'Work Pending' 
            });
          }
        }
      });

      const missingList = Array.from(combinedMissingMap.values());
      
      // Calculate realistic percentage: (Total - Missing) / Total
      const classTotal = classSizes[`${row.class_id}_${row.section_id}`] || students.length || 1;
      const submissionPct = Math.max(0, Math.round(((classTotal - missingList.length) / classTotal) * 100));

      totalWeeks++;
      if (submissionPct === 100) perfectWeeks++;
      totalDefaulters += missingList.length;

      // Ranking Tracker
      combinedMissingMap.forEach((data, sid) => {
        if (!studentDefaults[sid]) {
          studentDefaults[sid] = {
            id: sid,
            name: data.name,
            roll_no: data.roll_no,
            count: 0,
            contact: '—' 
          };
        }
        studentDefaults[sid].count++;
      });

      timeline[month].push({
        id: row.id,
        topic: row.topic || 'No Topic',
        week: row.week || 'No Week',
        class_name: row.class_name || 'N/A',
        subject: row.subject_name || 'Academic',
        submissionPct,
        missingCount: missingList.length,
        missingStudents: missingList,
        status: submissionPct === 100 ? 'Perfect' : submissionPct >= 75 ? 'Partial' : 'Critical',
        learning_outcome: row.learning_outcome,
        understanding_level: row.class_understanding_level
      });
    });

    // 4. Rankings & Contacts
    const rankings = Object.values(studentDefaults)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    if (rankings.length > 0) {
      const ids = rankings.map(r => r.id).filter(id => !!id);
      if (ids.length > 0) {
        const [contactRows] = await pool.query(`SELECT id, mobile FROM students WHERE id IN (?)`, [ids]);
        (contactRows || []).forEach(c => {
          const r = rankings.find(x => Number(x.id) === Number(c.id));
          if (r) r.contact = c.mobile || 'No Contact';
        });
      }
    }

    // 5. Observations
    const [obsRows] = await pool.query(`
      SELECT 
        id, created_at as date, total_score,
        content_mastery, pedagogy, student_engagement, communication, assessment
      FROM class_observations
      WHERE teacher_id = ?
      ORDER BY created_at DESC
      LIMIT 3
    `, [teacherId]);

    const observations = (obsRows || []).map(o => ({
      id: o.id,
      date: o.date,
      total_score: o.total_score,
      pct: Math.round((Number(o.total_score || 0) / 50) * 100),
      breakdown: {
        content: o.content_mastery || 0,
        pedagogy: o.pedagogy || 0,
        engagement: o.student_engagement || 0,
        communication: o.communication || 0,
        assessment: o.assessment || 0
      }
    }));

    // 6. Meta Data (Micro Schedule / Syllabus mapping)
    const [assigned] = await pool.query(`
      SELECT DISTINCT 
        ac.id as class_id, ac.class_number as class_name, 
        asec.id as section_id, asec.name as section_name,
        sub.id as subject_id, sub.name as subject_name
      FROM teacher_timetable tt
      JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
      LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
      JOIN subjects sub ON tt.subject_id = sub.id
      WHERE tt.teacher_id = ?
    `, [userId]);


    return res.json({
      success: true,
      data: {
        stats: {
          totalWeeks,
          totalDefaulters,
          perfectWeeks,
          mostDefaulters: rankings[0]?.name || 'N/A'
        },
        timeline,
        rankings,
        observations,
        meta: {
          assigned: (assigned || []).map(a => ({
            ...a,
            class_id: a.class_id ? Number(a.class_id) : null,
            section_id: a.section_id ? Number(a.section_id) : null,
            subject_id: a.subject_id ? Number(a.subject_id) : null
          }))
        }
      }
    });

  } catch (err) {
    console.error('[LO ANALYTICS CRITICAL ERROR]:', err);
    
    // Emergency Log for AI Diagnostic
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'scratch', 'lo_error_log.txt');
      fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] ERROR: ${err.message}\nSTACK: ${err.stack}\n`);
    } catch (logErr) {}

    return res.status(500).json({ 
      success: false, 
      message: "LO fetch failed",
      error: err.message 
    });
  }
};
