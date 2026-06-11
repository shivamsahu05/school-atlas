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
      warnings: []
    };

    try {
      const teacherId = req.user?.id;
      if (!teacherId) return res.json({ success: true, data: result });

      // 1. Fetch Syllabus/Micro-Schedule Data
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

      let loWeightedSum = 0;
      let loTotalCount = 0;
      let extraPeriodsCount = 0;

      rows.forEach(row => {
        result.syllabus.total++;
        const isTopicDone = row.is_completed === 1 || row.status === 'completed';
        if (isTopicDone) result.syllabus.completed++;

        if (row.periods_needed > 0) extraPeriodsCount++;

        const students = safeParse(row.students_data);
        const classLvl = (row.class_understanding_level || '').toLowerCase();
        
        // Calculate LO Score for this topic based on student data
        if (isTopicDone) {
          let topicLOPoints = 0;
          let topicStudentCount = 0;

          if (students.length > 0) {
            students.forEach(s => {
              const slvl = (s.learning_status || classLvl).toLowerCase();
              let points = 80; // Default Meeting
              if (slvl.includes('approach')) { points = 60; }
              else if (slvl.includes('exceed')) { points = 100; }
              else { points = 80; }
              
              // Penalize if homework or notebook is not done
              if (s.homework === false || s.homework_status === 'PENDING') points -= 10;
              if (row.notebook_checked === 'No') points -= 5;

              topicLOPoints += Math.max(0, points);
              topicStudentCount++;

              // Track alerts
              if (s.homework === false || s.homework_status === 'PENDING') {
                result.not_done_students.push({
                  id: row.id, topic: row.topic, week: row.week,
                  class: `${row.class_number || 'N/A'}-${row.section_name || 'N/A'}`, subject: row.subject_name,
                  status: 'Homework Pending', name: s.name || 'N/A'
                });
              }
            });
            // Count this as 1 Topic for the overall distribution
            if (classLvl.includes('exceed')) result.lo.exceeding++;
            else if (classLvl.includes('approach')) result.lo.approaching++;
            else result.lo.meeting++;
            result.lo.total++;
          } else if (classLvl && classLvl !== '-' && classLvl !== 'awaiting status') {
            let points = 80;
            if (classLvl.includes('approach')) { points = 60; result.lo.approaching++; }
            else if (classLvl.includes('exceed')) { points = 100; result.lo.exceeding++; }
            else { points = 80; result.lo.meeting++; }
            result.lo.total++;
            topicLOPoints += points;
            topicStudentCount = 1;
          }

          if (topicStudentCount > 0) {
            loWeightedSum += (topicLOPoints / topicStudentCount);
            loTotalCount++;
          }
        }
      });

      const syllabusPct = result.syllabus.total > 0 ? (result.syllabus.completed / result.syllabus.total) * 100 : 0;
      const loPct = loTotalCount > 0 ? (loWeightedSum / loTotalCount) : 0;

      // 2. Fetch Observation Data (Observation Score 25% + Language Proficiency 15%)
      const [obsRows] = await pool.execute(`
        SELECT 
          AVG(((content_mastery + pedagogy + student_engagement + communication + assessment) / 50) * 100) AS avg_obs,
          AVG((communication / 10) * 100) AS avg_lang
        FROM class_observations 
        WHERE teacher_id = ?
      `, [teacherId]);

      const obsPct = obsRows[0]?.avg_obs || 0;
      const langPct = obsRows[0]?.avg_lang || 0;

      // 3. Participation Score (10%)
      // Count participants from students in teacher's assigned classes
      const [partRows] = await pool.execute(`
        SELECT COUNT(DISTINCT ep.roll_no, ep.student_class) as participant_count
        FROM event_participants ep
        JOIN students st ON ep.roll_no = st.roll_no
        JOIN teacher_subjects ts ON st.class_id = ts.class_id
        WHERE ts.teacher_id = ?
      `, [teacherId]);
      
      const [totalStudentsRows] = await pool.execute(`
        SELECT COUNT(DISTINCT st.id) as total_students
        FROM students st
        JOIN teacher_subjects ts ON st.class_id = ts.class_id
        WHERE ts.teacher_id = ?
      `, [teacherId]);

      const totalStudents = totalStudentsRows[0]?.total_students || 1;
      const participatePct = Math.min(100, ((partRows[0]?.participant_count || 0) / totalStudents) * 500); // Scaled: 20% participation = 100% score

      // 4. Other Parameters (20%) - Deductions for extra periods and leaves
      const [leaveRows] = await pool.execute(`
        SELECT COUNT(*) as leave_count FROM leave_requests 
        WHERE user_id = ? AND status IN ('Approved', 'Pending')
      `, [teacherId]);

      const leaveCount = leaveRows[0]?.leave_count || 0;
      let otherScore = 100 - (extraPeriodsCount * 5) - (leaveCount * 2);
      otherScore = Math.max(0, otherScore);

      // Check overrides
      let finalSyllabus = syllabusPct;
      let finalLo = loPct;
      let finalObs = obsPct;
      let finalParticipate = participatePct;
      let finalOther = otherScore;
      let finalLang = langPct;
      let finalOverall = null;
      let remarks = "";

      try {
        const [overrideRows] = await pool.execute(`
          SELECT * FROM teacher_performance_overrides WHERE teacher_id = ?
        `, [teacherId]);

        if (overrideRows && overrideRows.length > 0) {
          const o = overrideRows[0];
          if (o.syllabus_completion_pct !== null) finalSyllabus = Number(o.syllabus_completion_pct);
          if (o.lo_avg_pct !== null) finalLo = Number(o.lo_avg_pct);
          if (o.observation_pct !== null) finalObs = Number(o.observation_pct);
          if (o.participate_score !== null) finalParticipate = Number(o.participate_score);
          if (o.other_score !== null) finalOther = Number(o.other_score);
          if (o.lang_score !== null) finalLang = Number(o.lang_score);
          if (o.overall_score !== null) finalOverall = Number(o.overall_score);
          if (o.remarks !== null) remarks = o.remarks;
        }
      } catch (err) {
        console.warn("Override table fetch failed or doesn't exist yet:", err.message);
      }

      if (finalOverall === null) {
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
          AVG(((content_mastery + pedagogy + student_engagement + communication + assessment) / 50) * 100) AS avg_obs,
          AVG((communication / 10) * 100) AS avg_lang
        FROM class_observations GROUP BY teacher_id
      `);

      const [leaveStats] = await pool.execute(`
        SELECT user_id as teacher_id, COUNT(*) as leave_count 
        FROM leave_requests WHERE status IN ('Approved', 'Pending') 
        GROUP BY user_id
      `);

      const [participationStats] = await pool.execute(`
        SELECT ts.teacher_id, COUNT(DISTINCT ep.roll_no, ep.student_class) as participant_count
        FROM event_participants ep
        JOIN students st ON ep.roll_no = st.roll_no
        JOIN teacher_subjects ts ON st.class_id = ts.class_id
        GROUP BY ts.teacher_id
      `);

      const [classSizeStats] = await pool.execute(`
        SELECT ts.teacher_id, COUNT(DISTINCT st.id) as total_students
        FROM students st
        JOIN teacher_subjects ts ON st.class_id = ts.class_id
        GROUP BY ts.teacher_id
      `);

      const [loStats] = await pool.execute(`
        SELECT 
          teacher_id,
          AVG(
            CASE 
              WHEN learning_status LIKE '%exceed%' THEN 100
              WHEN learning_status LIKE '%meet%' THEN 80
              WHEN learning_status LIKE '%approach%' THEN 60
              ELSE 0 
            END
          ) as avg_lo
        FROM syllabus 
        WHERE (is_completed = 1 OR status = 'completed') 
        AND learning_status IS NOT NULL 
        AND learning_status NOT IN ('-', 'awaiting status')
        GROUP BY teacher_id
      `);

      // Map data for quick lookup
      const syllabusMap = syllabusStats.reduce((acc, r) => ({ ...acc, [r.teacher_id]: r }), {});
      const obsMap = obsStats.reduce((acc, r) => ({ ...acc, [r.teacher_id]: r }), {});
      const leaveMap = leaveStats.reduce((acc, r) => ({ ...acc, [r.teacher_id]: r.leave_count }), {});
      const partMap = participationStats.reduce((acc, r) => ({ ...acc, [r.teacher_id]: r.participant_count }), {});
      const sizeMap = classSizeStats.reduce((acc, r) => ({ ...acc, [r.teacher_id]: r.total_students }), {});
      const loMap = loStats.reduce((acc, r) => ({ ...acc, [r.teacher_id]: r.avg_lo }), {});

      const rankedTeachers = teachers.map(t => {
        const s = syllabusMap[t.id] || { total: 0, completed: 0, extra_periods: 0 };
        const o = obsMap[t.id] || { avg_obs: 0, avg_lang: 0 };
        const leaves = leaveMap[t.id] || 0;
        const parts = partMap[t.id] || 0;
        const totalStu = sizeMap[t.id] || 1;
        const loVal = loMap[t.id] || 0;

        const syllabusPct = s.total > 0 ? (s.completed / s.total) * 100 : 0;
        const loPct = loVal || 0;
        const obsPct = o.avg_obs || 0;
        const partPct = Math.min(100, (parts / totalStu) * 500);
        const otherScore = Math.max(0, 100 - (s.extra_periods * 5) - (leaves * 2));
        const langPct = o.avg_lang || 0;

        const weightedScore = 
          (syllabusPct * 0.15) + 
          (loPct * 0.15) + 
          (obsPct * 0.25) + 
          (partPct * 0.10) + 
          (otherScore * 0.20) + 
          (langPct * 0.15);

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
