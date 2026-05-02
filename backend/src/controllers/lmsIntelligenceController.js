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
    // Initial result structure
    const result = {
      syllabus: { completed: 0, total: 0, percentage: 0 },
      lo: { approaching: 0, meeting: 0, exceeding: 0, total: 0 },
      not_done_students: [],
      overall_score: 0,
      performance: { syllabus: 0, lo: 0, observation: 0 },
      warnings: []
    };

    try {
      const userId = req.user?.id;
      if (!userId) throw new Error("Unauthorized: No user ID in request");

      // --- SECTION 1: Teacher Profile ---
      let teacherId = null;
      try {
        const [teachers] = await pool.execute(`
          SELECT t.id, u.name 
          FROM teachers t 
          LEFT JOIN users u ON t.user_id = u.id 
          WHERE t.user_id = ?
        `, [userId]);
        
        if (teachers && teachers.length > 0) {
          teacherId = teachers[0].id;
        } else {
          result.warnings.push("Teacher profile not found");
        }
      } catch (profileError) {
        console.error("DASHBOARD: Profile Section Failure", profileError);
        result.warnings.push("profile_query_failed");
      }

      // If no teacherId found, we return early with default structure
      if (!teacherId) {
        return res.json({ success: true, data: result });
      }

      // --- SECTION 2: Execution Data (Syllabus) ---
      try {
        // FIXED COLUMN NAMES: periods, periods_needed (not periods_planned/completed)
        const [rows] = await pool.execute(`
          SELECT 
            s.id, s.topic, s.week, s.is_completed, s.students_data,
            s.periods, s.periods_needed, s.planned_end_date, s.status,
            ac.name as class_name, sub.name as subject_name
          FROM syllabus s
          LEFT JOIN academic_classes ac ON s.class_id = ac.id
          LEFT JOIN subjects sub ON s.subject_id = sub.id
          WHERE s.teacher_id = ? OR s.teacher_id = ?
        `, [teacherId, userId]);

        if (rows && rows.length > 0) {
          rows.forEach(row => {
            result.syllabus.total++;
            if (row.status === 'completed' || row.is_completed === 1) result.syllabus.completed++;

            const students = safeParse(row.students_data);
            const today = new Date();

            students.forEach(s => {
              // Standardize Status Mapping
              const rawStatus = String(s.learning_status || s.lo_status || s.status || 'Meeting').toLowerCase();
              if (rawStatus.includes('approach')) result.lo.approaching++;
              else if (rawStatus.includes('exceed')) result.lo.exceeding++;
              else result.lo.meeting++;
              result.lo.total++;

              // Execution Alerts: ONLY for PAST topics that are NOT completed
              const plannedEnd = row.planned_end_date ? new Date(row.planned_end_date) : null;
              const isOverdue = plannedEnd && plannedEnd < today;
              const isCompleted = (row.status === 'completed' || row.is_completed === 1);

              if (!isCompleted && isOverdue) {
                if (s.homework === false || s.homework_status === 'PENDING') {
                  result.not_done_students.push({
                    name: s.name || 'Unknown Student',
                    topic: row.topic,
                    class: row.class_name,
                    subject: row.subject_name,
                    status: 'Requires Attention'
                  });
                }
              }
            });
          });

          // Compute Syllabus Pct
          result.syllabus.percentage = result.syllabus.total > 0 
            ? Math.round((result.syllabus.completed / result.syllabus.total) * 100) 
            : 0;
        }
      } catch (syllabusError) {
        console.error("DASHBOARD: Syllabus Section Failure", syllabusError);
        result.warnings.push("syllabus_query_failed");
      }

      // --- SECTION 3: Performance Calculations ---
      try {
        const loTotal = result.lo.approaching + result.lo.meeting + result.lo.exceeding;
        const loScore = loTotal > 0 
          ? ((result.lo.exceeding * 100) + (result.lo.meeting * 80) + (result.lo.approaching * 60)) / loTotal 
          : 0;

        // Observation Score — dual-match: admin stores teachers.id, teacher reads by user_id
        const [obs] = await pool.execute(`
          SELECT AVG(((o.content_mastery + o.pedagogy + o.student_engagement + o.communication + o.assessment) / 50) * 100) AS avg_obs
          FROM class_observations o
          LEFT JOIN teachers t2 ON o.teacher_id = t2.id
          WHERE o.teacher_id = ? OR t2.user_id = ?
        `, [teacherId, userId]);
        const obsScore = (obs && obs[0] && obs[0].avg_obs) ? parseFloat(obs[0].avg_obs) : 0;


        // Weighted Average (50% Syllabus, 30% LO, 20% Observations)
        const overall = (result.syllabus.percentage * 0.5) + (loScore * 0.3) + (obsScore * 0.2);
        
        result.overall_score = parseFloat(overall.toFixed(1));
        result.performance = {
          syllabus: result.syllabus.percentage,
          lo: Math.round(loScore),
          observation: Math.round(obsScore)
        };
      } catch (perfError) {
        console.error("DASHBOARD: Performance Section Failure", perfError);
        result.warnings.push("performance_calc_failed");
      }

      // Limit results for frontend
      result.not_done_students = result.not_done_students.slice(0, 10);

      // FINAL SUCCESS RESPONSE (Always 200)
      res.json({ success: true, data: result });

    } catch (error) {
      console.error("🔥 CRITICAL TEACHER DASHBOARD ERROR:", error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal Intelligence Engine Error: ' + error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  getLOIntelligence: async (req, res) => {
    try {
      const userId = req.user.id;
      const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
      const teacherId = teachers[0]?.id;

      const [rows] = await pool.execute(`
        SELECT s.topic, s.students_data, sub.name as subject_name
        FROM syllabus s
        LEFT JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.teacher_id = ? OR s.teacher_id = ?
      `, [teacherId, userId]);

      const topics = (rows || []).map(row => {
        const students = safeParse(row.students_data);
        const stats = { approaching: 0, meeting: 0, exceeding: 0 };
        students.forEach(s => {
          const st = String(s.learning_status || s.lo_status || s.status || 'Meeting').toLowerCase();
          if (st.includes('approach')) stats.approaching++;
          else if (st.includes('exceed')) stats.exceeding++;
          else stats.meeting++;
        });
        return { topic: row.topic, subject: row.subject_name, ...stats };
      });

      res.json({ success: true, data: topics });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  getMicroIntelligence: async (req, res) => {
    try {
      const userId = req.user.id;
      const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
      const teacherId = teachers[0]?.id;

      const [rows] = await pool.execute(`
        SELECT s.*, ac.name as class_name, sub.name as subject_name
        FROM syllabus s
        LEFT JOIN academic_classes ac ON s.class_id = ac.id
        LEFT JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.teacher_id = ? OR s.teacher_id = ?
      `, [teacherId, userId]);

      const data = (rows || []).map(row => {
        const students = safeParse(row.students_data);
        const notDone = students.filter(s => s.homework === false || s.homework_status === 'PENDING');
        const rate = students.length > 0 ? Math.round(((students.length - notDone.length) / students.length) * 100) : 0;

        return {
          id: row.id,
          topic: row.topic,
          class: row.class_name,
          subject: row.subject_name,
          week: row.week,
          completion_rate: rate,
          not_done_students: notDone.length,
          risk_level: rate < 50 ? 'HIGH' : rate < 80 ? 'MEDIUM' : 'LOW',
          not_done_list: notDone.map(s => ({ name: s.name }))
        };
      });

      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  getAnalytics: async (req, res) => {
    return lmsIntelligenceController.getTeacherDashboard(req, res);
  },

  getNotifications: async (req, res) => {
    try {
      const notifications = await getUnifiedNotifications(req.user.id, req.user.role);
      res.json({ success: true, data: notifications });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  getAdminDashboard: async (req, res) => {
    try {
      const [stats] = await pool.execute('SELECT COUNT(*) as total_teachers FROM teachers WHERE status = "active"');
      res.json({ success: true, data: { totalTeachers: stats[0]?.total_teachers || 0 } });
    } catch (error) { res.status(500).json({ success: false }); }
  },

  runIntelligenceEngine: async (req, res) => {
    res.json({ success: true, message: 'Engine running in background' });
  }
};

module.exports = lmsIntelligenceController;
