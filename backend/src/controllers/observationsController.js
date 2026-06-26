// src/controllers/observationsController.js
const prisma   = require('../config/db')
const pool     = require('../config/mysqlDb') // Using pool for raw SQL fallback
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const INCLUDE = {
  teacher:  { select: { id: true, name: true, email: true } },
  observer: { select: { id: true, name: true } },
}

/** GET /api/observations?teacher_id= */
const getObservations = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const { teacher_id } = req.query;

  try {
    // Attempt Prisma first (Modern/Production Stability)
    let where = {};
    if (req.user.role === 'teacher') {
      const teacher = await prisma.teachers.findUnique({ where: { user_id: req.user.id } });
      if (!teacher) return res.status(200).json({ success: true, data: [] });
      where.teacher_id = teacher.id;
    } else if (teacher_id) {
      where.teacher_id = Number(teacher_id);
    }

    const [items, total] = await Promise.all([
      prisma.class_observations.findMany({
        where,
        skip,
        take,
        include: {
          teacher: { include: { user: { select: { name: true, email: true } } } },
          observer: { select: { id: true, name: true } },
          class: true,
          section: true,
          subject: true
        },
        orderBy: { created_at: 'desc' }
      }),
      prisma.class_observations.count({ where })
    ]);

    const normalized = items.map(o => {
      const pct = Math.round((Number(o.total_score || 0) / 50) * 100);
      return {
        id: o.id,
        teacher_id: o.teacher_id,
        observation_date: o.created_at,
        total_score: o.total_score,
        max_score: 50,
        pct: pct,
        criteria_scores: [
          { name: 'Content Mastery', score: o.content_mastery },
          { name: 'Pedagogy', score: o.pedagogy },
          { name: 'Student Engagement', score: o.student_engagement },
          { name: 'Communication', score: o.communication },
          { name: 'Assessment', score: o.assessment }
        ],
        teacher: { id: o.teacher_id, name: o.teacher?.user?.name || '—', email: o.teacher?.user?.email || '' },
        observer: { id: o.observer_id, name: o.observer?.name || '—' },
        class_name: o.class?.name || '—',
        section_name: o.section?.name || '—',
        subject_name: o.subject?.name || '—',
        class_id: o.class_id,
        section_id: o.section_id,
        subject_id: o.subject_id
      };
    });

    const scores = normalized.map(o => o.pct).filter(v => v > 0);
    const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    return sendSuccess(res, {
      ...paginated(normalized, total, page, limit),
      averageScore,
      maxScore: scores.length ? Math.max(...scores) : null,
      minScore: scores.length ? Math.min(...scores) : null,
    });

  } catch (err) {
    console.warn('[OBSERVATIONS] Prisma failed, falling back to pool:', err.message);
    try {
        let sql, params;
        if (req.user.role === 'teacher') {
          const [tRows] = await pool.execute("SELECT id FROM teachers WHERE user_id = ?", [req.user.id]);
          const tDbId = tRows.length > 0 ? tRows[0].id : null;
          if (!tDbId) return res.status(200).json({ success: true, data: [] });
          sql = `SELECT o.*, u_teacher.name AS teacher_name, u_teacher.email AS teacher_email, u_observer.name AS observer_name, ROUND((o.total_score / 50) * 100) AS pct FROM class_observations o LEFT JOIN teachers t ON o.teacher_id = t.id LEFT JOIN users u_teacher ON t.user_id = u_teacher.id LEFT JOIN users u_observer ON o.observer_id = u_observer.id WHERE o.teacher_id = ? ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
          params = [tDbId, take, skip];
        } else if (teacher_id) {
          sql = `SELECT o.*, u_teacher.name AS teacher_name, u_teacher.email AS teacher_email, u_observer.name AS observer_name, ROUND((o.total_score / 50) * 100) AS pct FROM class_observations o LEFT JOIN teachers t ON o.teacher_id = t.id LEFT JOIN users u_teacher ON t.user_id = u_teacher.id LEFT JOIN users u_observer ON o.observer_id = u_observer.id WHERE o.teacher_id = ? ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
          params = [Number(teacher_id), take, skip];
        } else {
          sql = `SELECT o.*, COALESCE(u_teacher.name, u_alt.name, '—') AS teacher_name, COALESCE(u_teacher.email, u_alt.email, '') AS teacher_email, u_observer.name AS observer_name, ac.name AS class_name, asec.name AS section_name, sub.name AS subject_name, ROUND((o.total_score / 50) * 100) AS pct FROM class_observations o LEFT JOIN teachers t ON o.teacher_id = t.id LEFT JOIN users u_teacher ON t.user_id = u_teacher.id LEFT JOIN users u_alt ON o.teacher_id = u_alt.id AND t.id IS NULL LEFT JOIN users u_observer ON o.observer_id = u_observer.id LEFT JOIN academic_classes ac ON o.class_id = ac.id LEFT JOIN acad_sections asec ON o.section_id = asec.id LEFT JOIN subjects sub ON o.subject_id = sub.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
          params = [take, skip];
        }

        const [items] = await pool.execute(sql, params);
        const normalized = items.map(o => ({
          id: o.id, teacher_id: o.teacher_id, observation_date: o.created_at, total_score: o.total_score, max_score: 50, pct: o.pct ?? 0,
          criteria_scores: [{ name: 'Content Mastery', score: o.content_mastery },{ name: 'Pedagogy', score: o.pedagogy },{ name: 'Student Engagement', score: o.student_engagement },{ name: 'Communication', score: o.communication },{ name: 'Assessment', score: o.assessment }],
          teacher:  { id: o.teacher_id, name: o.teacher_name  || '—', email: o.teacher_email || '' },
          observer: { id: o.observer_id, name: o.observer_name || '—' },
          class_name: o.class_name, section_name: o.section_name, subject_name: o.subject_name
        }));
        return sendSuccess(res, paginated(normalized, normalized.length, page, limit));
    } catch (fallbackErr) {
        console.error('[OBSERVATIONS GET ERROR]:', fallbackErr);
        return sendError(res, 'Failed to fetch observations.', 500);
    }
  }
}

/** GET /api/teacher/observations */
const getTeacherObservations = async (req, res) => {
  try {
    const userId = req.user.id;
    // Attempt Prisma first
    const teacher = await prisma.teachers.findUnique({ where: { user_id: userId } });
    if (!teacher) return res.json({ success: true, data: [] });

    const rows = await prisma.class_observations.findMany({
      where: { teacher_id: teacher.id },
      include: { observer: { select: { name: true } } },
      orderBy: { created_at: 'desc' }
    });

    const sanitized = rows.map(r => ({
      ...r,
      observer_name: r.observer?.name || '—',
      total_score: Number(r.total_score || 0),
      max_score: 50,
      pct: Math.round((Number(r.total_score || 0) / 50) * 100),
      content_mastery: Number(r.content_mastery || 0),
      pedagogy: Number(r.pedagogy || 0),
      student_engagement: Number(r.student_engagement || 0),
      communication: Number(r.communication || 0),
      assessment: Number(r.assessment || 0)
    }));
    return res.json({ success: true, data: sanitized });

  } catch (err) {
    console.warn('[TEACHER OBS] Prisma fallback:', err.message);
    try {
      const userId = req.user.id;
      const [tRows] = await pool.execute("SELECT id FROM teachers WHERE user_id = ?", [userId]);
      if (tRows.length === 0) return res.json({ success: true, data: [] });
      const teacherId = tRows[0].id;

      const [rows] = await pool.execute(`
        SELECT o.*, u.name as observer_name, (o.content_mastery + o.pedagogy + o.student_engagement + o.communication + o.assessment) as calc_total, ROUND((o.total_score / 50) * 100) as pct
        FROM class_observations o JOIN users u ON u.id = o.observer_id WHERE o.teacher_id = ? ORDER BY o.created_at DESC
      `, [teacherId]);

      const sanitized = rows.map(r => ({
        ...r,
        total_score: Number(r.total_score || r.calc_total || 0),
        max_score: 50,
        pct: Number(r.pct || 0),
        content_mastery: Number(r.content_mastery || 0),
        pedagogy: Number(r.pedagogy || 0),
        student_engagement: Number(r.student_engagement || 0),
        communication: Number(r.communication || 0),
        assessment: Number(r.assessment || 0)
      }));
      return res.json({ success: true, data: sanitized });
    } catch (fErr) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

/** POST /api/observations */
const createObservation = async (req, res) => {
  const { teacher_id, total_score, criteria_scores, class_id, section_id, subject_id } = req.body
  const observerId = req.user.id;

  try {
    const criteria = {};
    if (Array.isArray(criteria_scores)) {
      criteria_scores.forEach(c => {
        if (c.name === 'Content Mastery') criteria.content_mastery = c.score;
        if (c.name === 'Pedagogy') criteria.pedagogy = c.score;
        if (c.name === 'Student Engagement') criteria.student_engagement = c.score;
        if (c.name === 'Communication') criteria.communication = c.score;
        if (c.name === 'Assessment') criteria.assessment = c.score;
      });
    }

    const result = await prisma.class_observations.create({
      data: {
        teacher_id: Number(teacher_id),
        observer_id: Number(observerId),
        total_score: Number(total_score),
        content_mastery: criteria.content_mastery || 0,
        pedagogy: criteria.pedagogy || 0,
        student_engagement: criteria.student_engagement || 0,
        communication: criteria.communication || 0,
        assessment: criteria.assessment || 0,
        class_id: class_id ? Number(class_id) : null,
        section_id: section_id ? Number(section_id) : null,
        subject_id: subject_id ? Number(subject_id) : null
      }
    });

    await recalcPerformance(Number(teacher_id));
    return sendSuccess(res, { id: result.id }, 'Observation recorded.', 201);

  } catch (err) {
    console.warn('[CREATE OBS] Prisma fallback:', err.message);
    try {
      const criteria = {};
      if (Array.isArray(criteria_scores)) {
        criteria_scores.forEach(c => {
          if (c.name === 'Content Mastery') criteria.content_mastery = c.score;
          if (c.name === 'Pedagogy') criteria.pedagogy = c.score;
          if (c.name === 'Student Engagement') criteria.student_engagement = c.score;
          if (c.name === 'Communication') criteria.communication = c.score;
          if (c.name === 'Assessment') criteria.assessment = c.score;
        });
      }
      const [result] = await pool.execute(
        `INSERT INTO class_observations (teacher_id, observer_id, total_score, content_mastery, pedagogy, student_engagement, communication, assessment, class_id, section_id, subject_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [Number(teacher_id), observerId, Number(total_score), criteria.content_mastery || 0, criteria.pedagogy || 0, criteria.student_engagement || 0, criteria.communication || 0, criteria.assessment || 0, class_id ? Number(class_id) : null, section_id ? Number(section_id) : null, subject_id ? Number(subject_id) : null]
      );
      await recalcPerformance(Number(teacher_id));
      return sendSuccess(res, { id: result.insertId }, 'Observation recorded.', 201);
    } catch (fErr) {
      return sendError(res, 'Failed to record observation. ' + err.message, 500);
    }
  }
}

async function recalcPerformance(teacher_id) {
  try {
    const tId = Number(teacher_id);
    console.log(`[RECALC] Recalculating performance for teacher: ${tId}`);

    // 1. Syllabus % (Using Prisma)
    const syllabus = await prisma.syllabus.findMany({ where: { teacher_id: tId } });
    const totalSyl = syllabus.length;
    const completedSyl = syllabus.filter(s => s.is_completed === 1 || s.status === 'completed').length;
    const sylPct = totalSyl ? Math.round((completedSyl / totalSyl) * 100) : 0;

    // 2. LO avg % (Using Prisma)
    const loScores = await prisma.teacher_performance_lo.findMany({ where: { teacher_id: tId } });
    const loAvg = loScores.length ? loScores.reduce((acc, curr) => acc + Number(curr.principal_score || 0), 0) / loScores.length : 0;
    const loPct = Math.round((loAvg / 10) * 100);

    // 3. Observation avg % (Using Prisma)
    const obs = await prisma.class_observations.findMany({ where: { teacher_id: tId } });
    const obsPct = obs.length ? Math.round(obs.reduce((acc, curr) => acc + (Number(curr.total_score || 0) / 50) * 100, 0) / obs.length) : 0;

    const otherScore = 75;
    const overall = (sylPct * 0.15) + (loPct * 0.20) + (obsPct * 0.30) + (otherScore * 0.35);

    await prisma.performance_scores.upsert({
      where: { teacher_id: tId },
      update: {
        syllabus_completion_pct: sylPct,
        lo_avg_pct: loPct,
        observation_pct: obsPct,
        other_score: otherScore,
        overall_score: overall,
        updated_at: new Date()
      },
      create: {
        teacher_id: tId,
        syllabus_completion_pct: sylPct,
        lo_avg_pct: loPct,
        observation_pct: obsPct,
        other_score: otherScore,
        overall_score: overall
      }
    });
    console.log(`[RECALC] Success for teacher: ${tId}, Overall: ${overall}`);

  } catch (err) {
    console.warn('[RECALC] Prisma failed, falling back to pool:', err.message);
    try {
      const [sylRows] = await pool.execute(`SELECT COUNT(*) as total, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed FROM syllabus WHERE teacher_id = ?`, [teacher_id]);
      const sylPct = sylRows[0].total ? Math.round((sylRows[0].completed / sylRows[0].total) * 100) : 0;
      const [loRows] = await pool.execute(`SELECT AVG(principal_score) as avg_score FROM teacher_performance_lo WHERE teacher_id = ?`, [teacher_id]);
      const loPct = loRows[0].avg_score ? Math.round((loRows[0].avg_score / 10) * 100) : 0;
      const [obsRows] = await pool.execute("SELECT total_score FROM class_observations WHERE teacher_id = ?", [teacher_id]);
      const obsPct = obsRows.length ? Math.round(obsRows.reduce((a, o) => a + (o.total_score / 50) * 100, 0) / obsRows.length) : 0;
      const otherScore = 75;
      const overall = (sylPct * 0.15) + (loPct * 0.20) + (obsPct * 0.30) + (otherScore * 0.35);
      await pool.execute(`INSERT INTO performance_scores (teacher_id, syllabus_completion_pct, lo_avg_pct, observation_pct, other_score, overall_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE syllabus_completion_pct = VALUES(syllabus_completion_pct), lo_avg_pct = VALUES(lo_avg_pct), observation_pct = VALUES(observation_pct), other_score = VALUES(other_score), overall_score = VALUES(overall_score), updated_at = NOW()`, [teacher_id, sylPct, loPct, obsPct, otherScore, overall]);
    } catch (fErr) {
      console.error('[RECALC CRITICAL ERROR]:', fErr.message);
    }
  }
}

module.exports = { getObservations, createObservation, getTeacherObservations, recalcPerformance }
