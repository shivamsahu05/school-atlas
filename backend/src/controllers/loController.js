const prisma = require('../config/db');
const pool = require('../config/mysqlDb');

/**
 * GET /api/admin/lo/meta
 */
exports.getLOMeta = async (req, res) => {
  console.log('[LO META] Fetching metadata...');
  try {
    const [classes, subjects, teachers] = await Promise.all([
      prisma.academic_classes.findMany({ orderBy: { sort_order: 'asc' } }),
      prisma.subjects.findMany({ orderBy: { name: 'asc' } }),
      prisma.teachers.findMany({
        where: { user: { status: 'active' } },
        include: { user: { select: { name: true } } }
      })
    ]);

    const sortedTeachers = teachers
      .map(t => ({ id: t.id, name: t.user?.name || 'Unknown' }))
      .sort((a, b) => a.name.localeCompare(b.name));

    let learningOutcomes = [];
    try {
      learningOutcomes = await prisma.learning_outcomes.findMany({
        select: { id: true, topic: true }
      });
    } catch (e) { console.warn('[LO META] learning_outcomes check failed'); }

    return res.status(200).json({
      success: true,
      data: {
        classes: classes.map(c => ({ id: c.id, class_name: c.name })),
        subjects: subjects,
        teachers: sortedTeachers,
        learning_outcomes: learningOutcomes.map(lo => ({ id: lo.id, title: lo.topic }))
      }
    });
  } catch (error) {
    console.warn('[LO META] Prisma fallback:', error.message);
    try {
      const [classes] = await pool.query('SELECT id, name as class_name FROM academic_classes ORDER BY sort_order');
      const [subjects] = await pool.query('SELECT id, name FROM subjects ORDER BY name');
      const [tRows] = await pool.query(`
        SELECT t.id, u.name FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.status = 'active' ORDER BY u.name
      `);
      let learningOutcomes = [];
      try {
        const [loRows] = await pool.query('SELECT id, topic as title FROM learning_outcomes');
        learningOutcomes = loRows || [];
      } catch (e) {}

      return res.status(200).json({
        success: true,
        data: {
          classes: classes || [],
          subjects: subjects || [],
          teachers: tRows || [],
          learning_outcomes: learningOutcomes.map(lo => ({ id: lo.id, title: lo.title }))
        }
      });
    } catch (fallbackError) {
      return res.status(500).json({ success: false, message: 'Failed to load metadata' });
    }
  }
};

/**
 * GET /api/admin/lo/subjects/:classId
 */
exports.getSubjectsByClass = async (req, res) => {
    const { classId } = req.params;
    try {
        const mappedSubjects = await prisma.acad_class_subjects.findMany({
            where: { class_id: Number(classId) },
            include: { subject: true }
        });

        if (mappedSubjects.length > 0) {
            return res.json({ success: true, data: mappedSubjects.map(ms => ms.subject) });
        }
        const allSubjects = await prisma.subjects.findMany({ orderBy: { name: 'asc' } });
        return res.json({ success: true, data: allSubjects });
    } catch (error) {
        console.warn('[LO SUBJECTS] Prisma fallback:', error.message);
        try {
            const [rows] = await pool.query(`
                SELECT DISTINCT s.id, s.name FROM subjects s
                JOIN acad_class_subjects acs ON s.id = acs.subject_id
                WHERE acs.class_id = ? ORDER BY s.name
            `, [classId]);
            if (rows.length === 0) {
                const [allSubjects] = await pool.query('SELECT id, name FROM subjects ORDER BY name');
                return res.json({ success: true, data: allSubjects });
            }
            return res.json({ success: true, data: rows });
        } catch (fError) { return res.status(500).json({ success: false, message: 'Failed to fetch subjects' }); }
    }
};

/**
 * GET /api/admin/lo/teachers/:classId/:subjectId
 */
exports.getTeachersByClassSubject = async (req, res) => {
    const { classId, subjectId } = req.params;
    try {
        const tsTeachers = await prisma.teacher_subjects.findMany({
            where: { class_id: Number(classId), subject_id: Number(subjectId) },
            include: { teacher: { include: { teacher_profile: true } } }
        });

        const cls = await prisma.academic_classes.findUnique({ where: { id: Number(classId) } });
        let ttTeachers = [];
        if (cls) {
          const classNum = cls.class_number || cls.name.replace(/[^0-9]/g, '');
          
          let secCondition = {};
          if (req.query.section_id) {
            const sec = await prisma.acad_sections.findUnique({ where: { id: Number(req.query.section_id) } });
            if (sec) {
              secCondition = {
                OR: [
                  { section: sec.name },
                  { section: sec.code },
                  { section: sec.name.replace('Section ', '') },
                  { section: '' }
                ]
              };
            }
          }

          const ttEntries = await prisma.teacher_timetable.findMany({
            where: {
              OR: [{ class_number: String(classNum) }, { class_number: String(cls.name) }],
              subject_id: Number(subjectId),
              ...secCondition
            }
          });
          if (ttEntries.length > 0) {
            const tIds = [...new Set(ttEntries.map(e => e.teacher_id))];
            ttTeachers = await prisma.users.findMany({
              where: { id: { in: tIds } },
              include: { teacher_profile: true }
            });
          }
        }
        
        let taTeachers = [];
        try {
          let taQuery = `
            SELECT t.id, u.name 
            FROM teacher_assignments ta
            JOIN teachers t ON ta.teacher_id = t.user_id
            JOIN users u ON t.user_id = u.id
            WHERE ta.class_id = ? AND ta.subject_id = ?
          `;
          let taParams = [Number(classId), Number(subjectId)];
          if (req.query.section_id) {
            taQuery += ` AND ta.section_id = ?`;
            taParams.push(Number(req.query.section_id));
          }
          const [taRows] = await pool.query(taQuery, taParams);
          taTeachers = taRows || [];
        } catch (taErr) {
          console.warn('[LO TEACHERS] teacher_assignments fetch error:', taErr.message);
        }

        const result = new Map();
        tsTeachers.forEach(ts => {
          if (ts.teacher?.teacher_profile) result.set(ts.teacher.teacher_profile.id, { id: ts.teacher.teacher_profile.id, name: ts.teacher.name });
        });
        ttTeachers.forEach(u => {
          if (u.teacher_profile) result.set(u.teacher_profile.id, { id: u.teacher_profile.id, name: u.name });
        });
        taTeachers.forEach(t => {
          result.set(t.id, { id: t.id, name: t.name });
        });

        const finalData = Array.from(result.values());
        if (finalData.length > 0) return res.json({ success: true, data: finalData });
        
        // Fallback: If no mapping, show ALL teachers (Profile IDs)
        const allTeachers = await prisma.teachers.findMany({
            where: { user: { status: 'active' } },
            include: { user: { select: { name: true } } },
            orderBy: { user: { name: 'asc' } }
        });
        return res.json({ success: true, data: allTeachers.map(t => ({ id: t.id, name: t.user?.name || 'Unknown' })) });
    } catch (error) {
        console.warn('[LO TEACHERS] Prisma fallback:', error.message);
        try {
            const [rows] = await pool.query(`
                SELECT DISTINCT t.id, u.name FROM teachers t
                JOIN users u ON t.user_id = u.id
                WHERE u.status = 'active'
                ORDER BY u.name
            `);
            return res.json({ success: true, data: rows });
        } catch (fError) { return res.status(500).json({ success: false, message: 'Failed to fetch teachers' }); }
    }
};

/**
 * POST /api/admin/lo/award
 */
exports.awardLOScore = async (req, res) => {
  let { teacher_id, class_id, subject_id, month, week, topic, score, lo_status, className, sectionName } = req.body;
  try {
    if (className && sectionName) {
      let cls = await prisma.classes.findFirst({ where: { class_name: className, section: sectionName } });
      if (!cls) cls = await prisma.classes.create({ data: { class_name: className, section: sectionName } });
      class_id = cls.id;
    }
    if (!teacher_id || !class_id || !subject_id || !month || !week || !topic || score === undefined) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const result = await prisma.teacher_performance_lo.create({
      data: {
        teacher_id: Number(teacher_id), 
        class_id: Number(class_id), 
        subject_id: Number(subject_id),
        month, 
        week, 
        topic, 
        principal_score: Number(score), 
        lo_status: (lo_status && ['Approaching', 'Meeting', 'Exceeding'].includes(lo_status)) ? lo_status : 'Meeting',
        status: (lo_status && ['Approaching', 'Meeting', 'Exceeding'].includes(lo_status)) ? lo_status : 'Meeting'
      }
    });
    return res.json({ success: true, message: 'Score awarded successfully', id: result.id });
  } catch (error) {
    console.error('[LO AWARD ERROR]:', error);
    try {
      const computedStatus = (lo_status && ['Approaching', 'Meeting', 'Exceeding'].includes(lo_status)) ? lo_status : 'Meeting';
      const [resPool] = await pool.query(
        'INSERT INTO teacher_performance_lo (teacher_id, class_id, subject_id, month, week, topic, principal_score, lo_status, status) VALUES (?,?,?,?,?,?,?,?, ?)',
        [teacher_id, class_id, subject_id, month, week, topic, score, computedStatus, computedStatus]
      );
      return res.json({ success: true, message: 'Score awarded successfully (via fallback)', id: resPool.insertId });
    } catch (fError) { 
      console.error('[LO AWARD FALLBACK ERROR]:', fError);
      return res.status(500).json({ success: false, message: 'Database error: ' + fError.message }); 
    }
  }
};

/**
 * GET /api/admin/lo/history
 */
exports.getLOHistory = async (req, res) => {
  try {
    const rows = await prisma.teacher_performance_lo.findMany({
      include: { teacher: { include: { teacher_profile: true } }, class: true, subject: true },
      orderBy: { created_at: 'desc' }
    });
    const formatted = await Promise.all(rows.map(async (row) => {
      let cName = row.class?.class_name || 'Unknown';
      let sec = row.class?.section || '';
      if (cName === 'Unknown') {
        const acad = await prisma.academic_classes.findUnique({ where: { id: row.class_id } });
        if (acad) cName = acad.name;
      }
      return {
        id: row.id, teacher_id: row.teacher_id, class_id: row.class_id, subject_id: row.subject_id,
        month: row.month, week: row.week, topic: row.topic, lo_status: row.lo_status,
        score: Number(row.principal_score || 0), teacher_name: row.teacher?.name || 'Unknown',
        class_name: cName, section: sec, subject_name: row.subject?.name || 'Unknown', created_at: row.created_at
      };
    }));
    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.warn('[LO HISTORY] Prisma fallback:', error.message);
    try {
      const [rows] = await pool.query(`
        SELECT tp.*, tp.principal_score as score, u.name as teacher_name, c.class_name, c.section, s.name as subject_name
        FROM teacher_performance_lo tp
        LEFT JOIN teachers t ON tp.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN classes c ON tp.class_id = c.id
        LEFT JOIN subjects s ON tp.subject_id = s.id
        ORDER BY tp.created_at DESC
      `);
      return res.json({ success: true, data: rows });
    } catch (fError) { return res.status(500).json({ success: false, message: error.message }); }
  }
};

/**
 * PUT /api/admin/lo/update/:id
 */
exports.updateLOScore = async (req, res) => {
  const { id } = req.params;
  const { score, topic, month, week, lo_status } = req.body;
  console.log(`[LO UPDATE] Request for ID: ${id}`, { score, topic, month, week, lo_status });
  try {
    await prisma.teacher_performance_lo.update({
      where: { id: Number(id) },
      data: { principal_score: score !== undefined ? Number(score) : undefined, topic, month, week, lo_status: lo_status || 'Meeting' }
    });
    return res.json({ success: true, message: 'Score updated successfully' });
  } catch (error) {
    try {
      await pool.query('UPDATE teacher_performance_lo SET principal_score=?, topic=?, month=?, week=?, lo_status=? WHERE id=?', [score, topic, month, week, lo_status || 'Meeting', id]);
      return res.json({ success: true, message: 'Score updated successfully' });
    } catch (fError) { return res.status(500).json({ success: false, message: error.message }); }
  }
};

/**
 * DELETE /api/admin/lo/delete/:id
 */
exports.deleteLOScore = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.teacher_performance_lo.delete({ where: { id: Number(id) } });
    return res.json({ success: true, message: 'Score deleted successfully' });
  } catch (error) {
    try {
      await pool.query('DELETE FROM teacher_performance_lo WHERE id=?', [id]);
      return res.json({ success: true, message: 'Score deleted successfully' });
    } catch (fError) { return res.status(500).json({ success: false, message: error.message }); }
  }
};

/**
 * GET /api/admin/lo/resolve-topic
 */
exports.getResolvedTopic = async (req, res) => {
  const { teacher_id, class_id, section_id, subject_id, month, week } = req.query;
  try {
    const teacher = await prisma.teachers.findUnique({ where: { id: Number(teacher_id) } });
    if (!teacher) throw new Error('No teacher');
    const uId = teacher.user_id;
    const syllabus = await prisma.syllabus.findMany({
      where: { teacher_id: uId, class_id: Number(class_id), section_id: section_id ? Number(section_id) : null, subject_id: Number(subject_id), status: { not: 'pending' } },
      orderBy: { created_at: 'desc' }
    });
    const tMonth = String(month || '').toLowerCase();
    const tWeek = String(week || '').toLowerCase().replace(/\s/g, '');
    const matched = syllabus.find(s => {
      const sMonth = String(s.month || '').toLowerCase();
      const sWeek = String(s.week || '').toLowerCase().replace(/\s/g, '');
      return (sMonth === tMonth && sWeek === tWeek) || ((sMonth + sWeek) === (tMonth + tWeek)) || ((!sMonth || sMonth === '') && sWeek === tWeek);
    });
    return res.json({ success: true, topic: matched ? matched.topic : null });
  } catch (error) {
    try {
      const [tRows] = await pool.query('SELECT user_id FROM teachers WHERE id = ?', [teacher_id]);
      if (tRows.length === 0) return res.json({ success: true, topic: null });
      const uId = tRows[0].user_id;
      const [rows] = await pool.query(`
        SELECT topic FROM syllabus WHERE teacher_id=? AND class_id=? AND section_id=? AND subject_id=?
        AND ((LOWER(month)=LOWER(?) AND REPLACE(LOWER(week),' ','')=REPLACE(LOWER(?),' ','')) OR REPLACE(LOWER(week),' ','')=REPLACE(LOWER(CONCAT(?,?)),' ',''))
        ORDER BY created_at DESC LIMIT 1
      `, [uId, class_id, section_id, subject_id, month, week, month, week]);
      return res.json({ success: true, topic: rows.length > 0 ? rows[0].topic : null });
    } catch (fError) { return res.status(500).json({ success: false, message: 'Topic resolution failed' }); }
  }
};

/**
 * GET /api/lo/teacher
 */
exports.getTeacherLOAnalytics = async (req, res) => {
  const userId = req.user?.id;
  const { class_id, section_id, subject_id } = req.query;

  console.log(`[LO ANALYTICS] Request by User: ${userId}`, { class_id, section_id, subject_id });

  try {
    // 1. Resolve Teacher ID from User ID
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    const [tRows] = await pool.query("SELECT id FROM teachers WHERE user_id = ?", [userId]);
    if (!tRows || tRows.length === 0) {
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

    // 3. Base Query for Syllabus
    let filterSql = "WHERE s.teacher_id = ? AND s.status != 'pending'";
    let params = [userId]; // syllabus table uses users.id as teacher_id in this setup

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
      ORDER BY s.created_at DESC
    `, params);

    // Fetch Student Level Status for Syllabus items
    const [studentStatusRows] = await pool.query(`
      SELECT mss.*, std.name, std.roll_no, std.mobile, s.topic, s.id as syllabus_id 
      FROM micro_schedule_student_status mss
      JOIN students std ON mss.student_id = std.id 
      JOIN syllabus s ON mss.syllabus_id = s.id 
      WHERE s.teacher_id = ?
    `, [userId]);

    // 3. Process Analytics
    const timeline = {};
    const studentDefaults = {}; 
    let totalWeeks = 0;
    let perfectWeeks = 0;
    let totalDefaulters = 0;

    (syllabusRows || []).forEach(row => {
      let month = row.month || 'Unplanned';
      if (month !== 'Unplanned') {
        month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
      }
      
      if (!timeline[month]) timeline[month] = [];

      const studentsInThisTopic = studentStatusRows.filter(t => t.syllabus_id === row.id);
      
      const combinedMissingMap = new Map();
      studentsInThisTopic.filter(s => !s.homework_completed || !s.notebook_checked).forEach(s => {
        const sid = Number(s.student_id);
        let reason = (!s.homework_completed && !s.notebook_checked) ? 'Homework & Notebook' : (!s.homework_completed ? 'Homework' : 'Notebook');
        combinedMissingMap.set(sid, { 
          name: s.name, 
          roll_no: s.roll_no, 
          contact: s.mobile || 'N/A',
          reason: reason
        });
      });

      const missingList = Array.from(combinedMissingMap.values());
      const classTotal = classSizes[`${row.class_id}_${row.section_id}`] || 1;
      const submissionPct = Math.max(0, Math.round(((classTotal - missingList.length) / classTotal) * 100));

      totalWeeks++;
      if (submissionPct === 100) perfectWeeks++;
      totalDefaulters += missingList.length;

      combinedMissingMap.forEach((data, sid) => {
        if (!studentDefaults[sid]) {
          studentDefaults[sid] = { id: sid, name: data.name, roll_no: data.roll_no, count: 0, contact: data.contact };
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
        understanding_level: row.class_understanding_level || row.learning_status || 'Awaiting Status'
      });
    });

    const rankings = Object.values(studentDefaults)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 5. Observations
    const [obsRows] = await pool.query(`
      SELECT id, created_at as date, total_score, content_mastery, pedagogy, student_engagement, communication, assessment
      FROM class_observations
      WHERE teacher_id = ?
      ORDER BY created_at DESC LIMIT 3
    `, [teacherId]);

    const observations = (obsRows || []).map(o => ({
      id: o.id, date: o.date, total_score: o.total_score,
      pct: Math.round((Number(o.total_score || 0) / 50) * 100),
      breakdown: { content: o.content_mastery, pedagogy: o.pedagogy, engagement: o.student_engagement, communication: o.communication, assessment: o.assessment }
    }));

    // 6. Award LO Scores
    const [awardRows] = await pool.query(`
      SELECT tp.id, tp.created_at as date, tp.principal_score as score, tp.lo_status, tp.topic, tp.month, tp.week,
             c.class_name, c.section, s.name as subject_name
      FROM teacher_performance_lo tp
      LEFT JOIN classes c ON tp.class_id = c.id
      LEFT JOIN subjects s ON tp.subject_id = s.id
      WHERE tp.teacher_id = ?
      ORDER BY tp.created_at DESC LIMIT 5
    `, [teacherId]);

    const awardLo = (awardRows || []).map(a => ({
      id: a.id, date: a.date, score: a.score, status: a.lo_status, topic: a.topic,
      month: a.month, week: a.week, class_name: a.class_name, section: a.section, subject: a.subject_name
    }));

    const [assigned] = await pool.query(`
      SELECT DISTINCT s.class_id, ac.name as class_name, s.section_id, asec.name as section_name, s.subject_id, sub.name as subject_name
      FROM syllabus s
      LEFT JOIN academic_classes ac ON s.class_id = ac.id
      LEFT JOIN acad_sections asec ON s.section_id = asec.id
      LEFT JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.teacher_id = ?
    `, [userId]);

    return res.json({
      success: true,
      data: {
        stats: { totalWeeks, totalDefaulters, perfectWeeks, mostDefaulters: rankings[0]?.name || 'N/A' },
        timeline,
        rankings,
        observations,
        awardLo,
        meta: { assigned }
      }
    });

  } catch (err) {
    console.error('[TEACHER LO ERROR]:', err);
    
    // EMERGENCY LOG FOR DIAGNOSTIC
    try {
      const fs = require('fs');
      const path = require('path');
      const logDir = path.join(process.cwd(), 'scratch');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logPath = path.join(logDir, 'lo_error_log.txt');
      fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] ERROR: ${err.message}\nSTACK: ${err.stack}\n`);
    } catch (logErr) {
      console.error('Logging failed:', logErr);
    }

    return res.status(500).json({ success: false, message: "LO fetch failed", error: err.message });
  }
};
