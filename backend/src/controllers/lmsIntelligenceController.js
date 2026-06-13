const pool = require('../config/mysqlDb');
const { getUnifiedNotifications } = require('../utils/notificationHelper');

// Helper for ultra-safe JSON parsing
const safeParse = (data) => {
  if (!data) return [];
  if (typeof data !== 'string') return Array.isArray(data) ? data : [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const lmsIntelligenceController = {
  getTeacherDashboard: async (req, res) => {
    const result = {
      syllabus: { completed: 0, total: 0, percentage: 0 },
      lo: { approaching: 0, meeting: 0, exceeding: 0, total: 0 },
      not_done_students: [], 
      overall_score: 0,
      performance: { syllabus: 0, lo: 0, observation: 0 },
      participate_score: 0,
      other_score: 0,
      lang_score: 0,
      admin_scores_set: false, // true when admin has manually saved participate/other/lang
      warnings: []
    };

    try {
      const teacherId = req.user?.id;
      if (!teacherId) return res.json({ success: true, data: result });

      // 1. Fetch Syllabus/Micro-Schedule Data (for Syllabus Completion %)
      const [rows] = await pool.execute(`
        SELECT 
          s.id, s.topic, s.week, s.month, s.is_completed, s.status, s.students_data,
          s.periods, s.periods_needed, s.learning_status as class_understanding_level, s.notebook_checked,
          s.class_id, s.section_id, s.subject_id,
          ac.class_number, asec.name as section_name, sub.name as subject_name
        FROM syllabus s
        LEFT JOIN academic_classes ac ON s.class_id = ac.id
        LEFT JOIN acad_sections asec ON s.section_id = asec.id
        LEFT JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.teacher_id = ?
      `, [teacherId]);

      rows.forEach(row => {
        result.syllabus.total++;
        const isTopicDone = row.is_completed === 1 || row.status === 'completed';
        if (isTopicDone) result.syllabus.completed++;

        const students = safeParse(row.students_data);
        const classLvl = (row.class_understanding_level || '').toLowerCase();

        // Track student homework alerts and LO distribution (for lo object counts only)
        if (isTopicDone) {
          if (students.length > 0) {
            students.forEach(s => {
              if (s.homework === false || s.homework_status === 'PENDING') {
                result.not_done_students.push({
                  id: row.id, topic: row.topic, week: row.week,
                  class: `${row.class_number || 'N/A'}-${row.section_name || 'N/A'}`, subject: row.subject_name,
                  status: 'Homework Pending', name: s.name || 'N/A'
                });
              }
            });
            if (classLvl.includes('exceed')) result.lo.exceeding++;
            else if (classLvl.includes('approach')) result.lo.approaching++;
            else result.lo.meeting++;
            result.lo.total++;
          } else if (classLvl && classLvl !== '-' && classLvl !== 'awaiting status') {
            if (classLvl.includes('approach')) result.lo.approaching++;
            else if (classLvl.includes('exceed')) result.lo.exceeding++;
            else result.lo.meeting++;
            result.lo.total++;
          }
        }
      });

      const syllabusPct = result.syllabus.total > 0 ? (result.syllabus.completed / result.syllabus.total) * 100 : 0;

      // 2. LO Achievement — sourced from Award LO module (teacher_performance_lo)
      // Admin awards a principal_score per topic via /admin/award-lo
      // First resolve teacher profile id from user id
      let loPct = 0;
      try {
        const [tProfileRows] = await pool.execute(
          'SELECT id FROM teachers WHERE user_id = ?', [teacherId]
        );
        if (tProfileRows && tProfileRows.length > 0) {
          const teacherProfileId = tProfileRows[0].id;
          const [loRows] = await pool.execute(`
            SELECT AVG(principal_score) AS avg_lo_score
            FROM teacher_performance_lo
            WHERE teacher_id = ?
          `, [teacherProfileId]);
          loPct = loRows[0]?.avg_lo_score != null ? Number(loRows[0].avg_lo_score) : 0;
        }
      } catch (loErr) {
        console.warn('LO Award fetch failed:', loErr.message);
      }

      // 3. Fetch Observation Data (Observation Score 25%)
      // Language Proficiency is admin-only; not computed from observations.
      const [obsRows] = await pool.execute(`
        SELECT 
          AVG(((content_mastery + pedagogy + student_engagement + communication + assessment) / 50) * 100) AS avg_obs
        FROM class_observations 
        WHERE teacher_id = ?
      `, [teacherId]);

      const obsPct = obsRows[0]?.avg_obs || 0;

      // 4. Participate Score (10%), Other Parameters (20%), Language Proficiency (15%)
      // These are ADMIN-ONLY manual values. Default to 0 until admin sets them.
      let finalSyllabus = syllabusPct;
      let finalLo = loPct;
      let finalObs = obsPct;
      let finalParticipate = 0; // admin-only
      let finalOther = 0;       // admin-only
      let finalLang = 0;        // admin-only
      let finalOverall = null;
      let adminScoresSet = false;
      let remarks = "";

      try {
        const [overrideRows] = await pool.execute(`
          SELECT * FROM teacher_performance_overrides WHERE teacher_id = ?
        `, [teacherId]);

        if (overrideRows && overrideRows.length > 0) {
          const o = overrideRows[0];
          // Syllabus, LO, Observation overrides (kept for backward compat; unused in normal flow)
          if (o.syllabus_completion_pct !== null) finalSyllabus = Number(o.syllabus_completion_pct);
          if (o.lo_avg_pct !== null) finalLo = Number(o.lo_avg_pct);
          if (o.observation_pct !== null) finalObs = Number(o.observation_pct);
          // Admin-only manual scores
          if (o.participate_score !== null) { finalParticipate = Number(o.participate_score); adminScoresSet = true; }
          if (o.other_score !== null) { finalOther = Number(o.other_score); adminScoresSet = true; }
          if (o.lang_score !== null) { finalLang = Number(o.lang_score); adminScoresSet = true; }
          if (o.overall_score !== null) finalOverall = Number(o.overall_score);
          if (o.remarks !== null) remarks = o.remarks;
        }
      } catch (err) {
        console.warn("Override table fetch failed or doesn't exist yet:", err.message);
      }

      if (finalOverall === null) {
        // Formula: Syllabus(15%) + LO(15%) + Observation(25%) + Participate(10%) + Other(20%) + Language(15%)
        const totalWeighted = 
          (finalSyllabus * 0.15) + 
          (finalLo * 0.15) + 
          (finalObs * 0.25) + 
          (finalParticipate * 0.10) + 
          (finalOther * 0.20) + 
          (finalLang * 0.15);
        finalOverall = parseFloat(totalWeighted.toFixed(1));
      }

      result.syllabus.percentage = Math.round(finalSyllabus);
      result.overall_score = finalOverall;
      result.performance = { 
        syllabus: Math.round(finalSyllabus), 
        lo: Math.round(finalLo), 
        observation: Math.round(finalObs) 
      };
      result.participate_score = Math.round(finalParticipate);
      result.other_score = Math.round(finalOther);
      result.lang_score = Math.round(finalLang);
      result.admin_scores_set = adminScoresSet;
      result.remarks = remarks;
      
      result.not_done_students = result.not_done_students.slice(0, 15);
      res.json({ success: true, data: { ...result, all_rows: rows } });
    } catch (error) {
      console.error("DASHBOARD ERROR:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getLOIntelligence: async (req, res) => {
    try {
      const teacherId = req.user?.id;
      const [rows] = await pool.execute(`
        SELECT s.students_data, topic, sub.name as subjectName
        FROM syllabus s JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.teacher_id = ? AND (s.is_completed = 1 OR s.status = 'completed')
      `, [teacherId]);

      const stats = { approaching: 0, meeting: 0, exceeding: 0, total: 0 };
      const topics = rows.map(r => {
        const students = safeParse(r.students_data);
        const tstats = { approaching: 0, meeting: 0, exceeding: 0 };
        
        if (students.length > 0) {
          students.forEach(s => {
            const slvl = (s.learning_status || 'meeting').toLowerCase();
            if (slvl.includes('approach')) { tstats.approaching++; stats.approaching++; }
            else if (slvl.includes('exceed')) { tstats.exceeding++; stats.exceeding++; }
            else { tstats.meeting++; stats.meeting++; }
            stats.total++;
          });
        } else {
          // Use class level if student data is empty
          const clvl = (r.learning_status || 'meeting').toLowerCase();
          if (clvl.includes('approach')) { tstats.approaching++; stats.approaching++; }
          else if (clvl.includes('exceed')) { tstats.exceeding++; stats.exceeding++; }
          else { tstats.meeting++; stats.meeting++; }
          stats.total++;
        }
        return { topic: r.topic, subject: r.subjectName, ...tstats };
      });
      res.json({ success: true, data: { distribution: stats, topics } });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  },

  getMicroIntelligence: async (req, res) => {
    try {
      const teacherId = req.user?.id;
      const [rows] = await pool.execute(`
        SELECT s.*, ac.name as class_name, sub.name as subject_name
        FROM syllabus s LEFT JOIN academic_classes ac ON s.class_id = ac.id LEFT JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.teacher_id = ?
      `, [teacherId]);

      const data = rows.map(row => {
        const students = safeParse(row.students_data);
        const notDone = students.filter(s => s.homework === false || s.homework_status === 'PENDING');
        const rate = students.length > 0 ? Math.round(((students.length - notDone.length) / students.length) * 100) : 0;
        return { id: row.id, topic: row.topic, class: row.class_name, subject: row.subject_name, week: row.week, completion_rate: rate, not_done_students: notDone.length, risk_level: rate < 50 ? 'HIGH' : rate < 80 ? 'MEDIUM' : 'LOW' };
      });
      res.json({ success: true, data });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
  },

  getTopPerformersList: async (req, res) => {
    try {
      // 1. Fetch all active teachers
      const [teachers] = await pool.execute(`
        SELECT u.id, u.name 
        FROM users u 
        JOIN teachers t ON u.id = t.user_id 
        WHERE u.role = 'teacher' AND t.status = 'active' AND t.is_deleted = 0
      `);

      // 2. Fetch all required bulk data for all teachers to avoid N+1 queries
      const [syllabusStats] = await pool.execute(`
        SELECT 
          teacher_id,
          COUNT(*) as total,
          SUM(CASE WHEN is_completed = 1 OR status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN periods_needed > 0 THEN 1 ELSE 0 END) as extra_periods
        FROM syllabus GROUP BY teacher_id
      `);

      const [obsStats] = await pool.execute(`
        SELECT 
          teacher_id,
          AVG(((content_mastery + pedagogy + student_engagement + communication + assessment) / 50) * 100) AS avg_obs
        FROM class_observations GROUP BY teacher_id
      `);

      // LO from Award LO module (teacher_performance_lo), keyed by teacher profile id
      const [loAwardStats] = await pool.execute(`
        SELECT tpl.teacher_id, AVG(tpl.principal_score) AS avg_lo_score
        FROM teacher_performance_lo tpl
        GROUP BY tpl.teacher_id
      `);

      // Map teacher profile id -> user id for LO lookup
      const [teacherProfileMap] = await pool.execute(`
        SELECT t.id as profile_id, t.user_id FROM teachers t
      `);
      const profileToUser = teacherProfileMap.reduce((acc, r) => ({ ...acc, [r.profile_id]: r.user_id }), {});
      // Build user_id -> avg_lo_score map
      const loMap = {};
      loAwardStats.forEach(r => {
        const userId = profileToUser[r.teacher_id];
        if (userId) loMap[userId] = Number(r.avg_lo_score || 0);
      });

      // Map data for quick lookup
      const syllabusMap = syllabusStats.reduce((acc, r) => ({ ...acc, [r.teacher_id]: r }), {});
      const obsMap = obsStats.reduce((acc, r) => ({ ...acc, [r.teacher_id]: r }), {});

      // Fetch admin overrides for manual scores
      const [overrides] = await pool.execute(`
        SELECT teacher_id, participate_score, other_score, lang_score, overall_score 
        FROM teacher_performance_overrides
      `);
      const overrideMap = overrides.reduce((acc, r) => ({ ...acc, [r.teacher_id]: r }), {});

      const rankedTeachers = teachers.map(t => {
        const s = syllabusMap[t.id] || { total: 0, completed: 0, extra_periods: 0 };
        const o = obsMap[t.id] || { avg_obs: 0 };
        const ov = overrideMap[t.id] || {};

        const syllabusPct = s.total > 0 ? (s.completed / s.total) * 100 : 0;
        const loPct = loMap[t.id] || 0;
        const obsPct = o.avg_obs || 0;
        
        // Admin set scores or default 0
        const partPct = ov.participate_score != null ? Number(ov.participate_score) : 0;
        const otherScore = ov.other_score != null ? Number(ov.other_score) : 0;
        const langPct = ov.lang_score != null ? Number(ov.lang_score) : 0;

        let weightedScore = 0;
        if (ov.overall_score != null) {
          weightedScore = Number(ov.overall_score);
        } else {
          weightedScore = 
            (syllabusPct * 0.15) + 
            (loPct * 0.15) + 
            (obsPct * 0.25) + 
            (partPct * 0.10) + 
            (otherScore * 0.20) + 
            (langPct * 0.15);
        }

        return {
          teacher_id: t.id,
          teacher_name: t.name,
          weighted_score: parseFloat(weightedScore.toFixed(1)),
          details: { syllabusPct, loPct, obsPct, partPct, otherScore, langPct }
        };
      });

      rankedTeachers.sort((a, b) => b.weighted_score - a.weighted_score);
      
      if (res) res.json({ success: true, data: rankedTeachers.slice(0, 10) });
      return rankedTeachers;
    } catch (error) {
      console.error("TOP PERFORMERS ERROR:", error);
      if (res) res.status(500).json({ success: false, message: error.message });
      return [];
    }
  },

  getAnalytics: async (req, res) => lmsIntelligenceController.getTeacherDashboard(req, res),
  getNotifications: async (req, res) => {
    const notifications = await getUnifiedNotifications(req.user.id, req.user.role);
    res.json({ success: true, data: notifications });
  },
  getAdminDashboard: async (req, res) => {
    const [stats] = await pool.execute('SELECT COUNT(*) as total_teachers FROM teachers WHERE status = "active"');
    res.json({ success: true, data: { totalTeachers: stats[0]?.total_teachers || 0 } });
  },
  runIntelligenceEngine: async (req, res) => res.json({ success: true, message: 'Engine running in background' })
};

module.exports = lmsIntelligenceController;
