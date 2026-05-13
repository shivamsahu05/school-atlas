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
      const userId = req.user?.id; 
      if (!userId) return res.json({ success: true, data: result });

      // 1. Fetch Teacher Data & Assignments
      const [teacherRows] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
      const teacherProfileId = teacherRows[0]?.id;

      const [syllabusRows] = await pool.execute(`
        SELECT 
          s.id, s.topic, s.week, s.month, s.is_completed, s.status, s.students_data,
          s.periods, s.periods_needed, s.class_understanding_level, s.notebook_checked,
          s.planned_end_date, s.completed_date,
          s.class_id, s.section_id, s.subject_id,
          ac.class_number, asec.name as section_name, sub.name as subject_name
        FROM syllabus s
        LEFT JOIN academic_classes ac ON s.class_id = ac.id
        LEFT JOIN acad_sections asec ON s.section_id = asec.id
        LEFT JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.teacher_id = ?
      `, [userId]);

      // 2. Syllabus Completion & LO Achievement Logic
      let totalTasks = 0;
      let completedTasks = 0;
      let onTimeTopics = 0;
      let totalPeriodsPlanned = 0;
      let totalPeriodsNeeded = 0;

      syllabusRows.forEach(row => {
        result.syllabus.total++;
        const isTopicDone = row.is_completed === 1 || row.status === 'completed';
        if (isTopicDone) {
          result.syllabus.completed++;
          // Timeliness check
          if (row.completed_date && row.planned_end_date) {
            if (new Date(row.completed_date) <= new Date(row.planned_end_date)) {
              onTimeTopics++;
            }
          } else {
            onTimeTopics++; // Assume on time if no dates but completed
          }
        }

        totalPeriodsPlanned += (row.periods || 0);
        totalPeriodsNeeded += (row.periods_needed || 0);

        const students = safeParse(row.students_data);
        const classLvl = (row.class_understanding_level || '').toLowerCase();
        
        // LO Distribution
        if (isTopicDone && classLvl && classLvl !== '-' && classLvl !== 'awaiting status') {
          if (classLvl.includes('approach')) result.lo.approaching++;
          else if (classLvl.includes('exceed')) result.lo.exceeding++;
          else if (classLvl.includes('meet')) result.lo.meeting++;
          result.lo.total++;
        }

        // Detailed LO / Work Compliance (Homework + Notebook)
        if (students.length > 0) {
          students.forEach(s => {
            totalTasks += 2; // 1 for homework, 1 for notebook
            if (s.homework === true || s.homework_status === 'COMPLETED') completedTasks++;
            if (s.notebook === true || s.notebook_status === 'CHECKED') completedTasks++;

            // Execution Alerts
            if (s.homework === false || s.homework_status === 'PENDING') {
              result.not_done_students.push({
                id: row.id, topic: row.topic, week: row.week,
                class: `${row.class_number || 'N/A'}-${row.section_name || 'N/A'}`, subject: row.subject_name,
                status: 'Homework Pending', name: s.name || 'N/A'
              });
            }
          });
        } else if (isTopicDone) {
          // If no student data, use row level indicators
          totalTasks += 1;
          if (row.notebook_checked === 'Yes') completedTasks++;
        }
      });

      result.syllabus.percentage = result.syllabus.total > 0 
        ? Math.round((result.syllabus.completed / result.syllabus.total) * 100) : 0;

      const loAchievementPct = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // 3. Observation Score & Language Proficiency
      const [obsRows] = await pool.execute(`
        SELECT 
          AVG(content_mastery) as avg_content,
          AVG(pedagogy) as avg_pedagogy,
          AVG(student_engagement) as avg_engagement,
          AVG(communication) as avg_comm,
          AVG(assessment) as avg_assess,
          AVG(((content_mastery + pedagogy + student_engagement + communication + assessment) / 50) * 100) AS total_avg
        FROM class_observations WHERE teacher_id = ?
      `, [userId]);
      
      const observationScore = obsRows[0]?.total_avg || 0;
      const langProficiency = obsRows[0]?.avg_comm ? (obsRows[0].avg_comm / 10) * 100 : 0;

      // 4. Participate Score
      // Find students in classes assigned to this teacher
      let participatePct = 0;
      if (teacherProfileId) {
        const [assignments] = await pool.execute('SELECT class_id, section_id FROM teacher_class_assignments WHERE teacher_id = ?', [teacherProfileId]);
        if (assignments.length > 0) {
          const classIds = assignments.map(a => a.class_id);
          const [participantCount] = await pool.execute(`
            SELECT COUNT(DISTINCT student_name) as count 
            FROM event_participants 
            WHERE student_class IN (SELECT name FROM academic_classes WHERE id IN (${classIds.join(',')}))
          `);
          // Score calculation: 5+ participants = 100%, otherwise ratio
          participatePct = Math.min((participantCount[0]?.count || 0) * 20, 100);
        }
      }

      // 5. Other Parameters (Timeliness, Efficiency, Leaves)
      const timelinessScore = result.syllabus.total > 0 ? (onTimeTopics / result.syllabus.total) * 100 : 100;
      const efficiencyScore = (totalPeriodsPlanned + totalPeriodsNeeded) > 0 
        ? (totalPeriodsPlanned / (totalPeriodsPlanned + totalPeriodsNeeded)) * 100 : 100;
      
      const [leaveRows] = await pool.execute('SELECT COUNT(*) as count FROM leave_requests WHERE user_id = ? AND status = "Approved"', [userId]);
      const leaveScore = Math.max(100 - ((leaveRows[0]?.count || 0) * 10), 0); // 10% penalty per approved leave

      const otherParametersScore = (timelinessScore * 0.4) + (efficiencyScore * 0.4) + (leaveScore * 0.2);

      // 6. FINAL WEIGHTED CALCULATION
      // 1. Syllabus (15%)
      // 2. LO Achievement (15%)
      // 3. Observation (25%)
      // 4. Participate (10%)
      // 5. Other (20%)
      // 6. Language (15%)
      
      result.performance = {
        syllabus: Math.round(result.syllabus.percentage),
        lo: Math.round(loAchievementPct),
        observation: Math.round(observationScore)
      };
      result.participate_score = Math.round(participatePct);
      result.other_score = Math.round(otherParametersScore);
      result.lang_score = Math.round(langProficiency);

      result.overall_score = parseFloat((
        (result.performance.syllabus * 0.15) +
        (result.performance.lo * 0.15) +
        (result.performance.observation * 0.25) +
        (result.participate_score * 0.10) +
        (result.other_score * 0.20) +
        (result.lang_score * 0.15)
      ).toFixed(1));

      result.not_done_students = result.not_done_students.slice(0, 15);
      res.json({ success: true, data: { ...result, all_rows: syllabusRows } });
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
        students.forEach(s => {
          const slvl = (s.learning_status || 'meeting').toLowerCase();
          if (slvl.includes('approach')) { tstats.approaching++; stats.approaching++; }
          else if (slvl.includes('exceed')) { tstats.exceeding++; stats.exceeding++; }
          else { tstats.meeting++; stats.meeting++; }
          stats.total++;
        });
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
