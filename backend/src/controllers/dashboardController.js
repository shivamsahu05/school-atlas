// src/controllers/dashboardController.js
// FIXED: observations join (teacher_id -> users.id directly, not teachers.id)
// ADDED: teacher dashboard endpoint
const pool = require('../config/mysqlDb');

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
exports.getAdminMetrics = async (req, res) => {
  try {
    const [
      [overviewRows],
      [eventRows],
      [observationRows],
      [topPerformerRows],
      [managementRows],
      [overdueHomeworkRows],
      [pendingLeaveRows],
      [syllabusRows],
      [studentBdayRows],
      [teacherBdayRows],
      [hwTrackingRows],
      [pendingPermRows],
    ] = await Promise.all([

      // 1. Overview KPIs
      pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM students) AS totalStudents,
          (SELECT COUNT(*) FROM teachers WHERE is_deleted = 0) AS totalTeachers,
          (SELECT COUNT(*) FROM academic_classes) AS totalClasses,
          (SELECT AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 FROM syllabus) AS syllabusCompletion
      `),

      // 2. Upcoming Events
      pool.execute(`
        SELECT id, title, description, event_date AS date, 
               target_class AS class, event_type AS type 
        FROM school_events 
        WHERE event_date >= CURDATE() AND status != 'completed'
        ORDER BY event_date ASC 
        LIMIT 5
      `),

      // 3. Observation Scores — safe version (single user path)
      pool.execute(`
        SELECT
          u.id AS teacher_id,
          u.name AS teacher_name,
          COALESCE(AVG((o.total_score / NULLIF(o.max_score, 0)) * 100), 0) AS avgScore
        FROM observations o
        LEFT JOIN teachers t ON o.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE u.id IS NOT NULL
        GROUP BY u.id, u.name
        ORDER BY avgScore DESC
        LIMIT 5
      `),

      // 4. Top Performing Teachers (70% teacher_score + 30% principal_score)
      pool.execute(`
        SELECT
          u.name AS teacher_name,
          COALESCE(AVG(tpl.teacher_score), 0) AS avg_teacher_score,
          COALESCE(AVG(tpl.principal_score), 0) AS avg_principal_score,
          ROUND(
            COALESCE(AVG(tpl.teacher_score), 0) * 0.7 +
            COALESCE(AVG(tpl.principal_score), 0) * 0.3
          , 1) AS weighted_score
        FROM teacher_performance_lo tpl
        LEFT JOIN teachers t ON tpl.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE u.id IS NOT NULL
        GROUP BY u.id, u.name
        ORDER BY weighted_score DESC
        LIMIT 5
      `),

      // 5. Management counters
      pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM homework_submissions WHERE status='pending') AS pendingHomework,
          (SELECT COUNT(*) FROM syllabus WHERE status != 'completed') AS incompleteSyllabus,
          (SELECT COUNT(*) FROM leave_requests WHERE status='Pending') AS pendingLeaves,
          (SELECT COUNT(*) FROM teacher_module_permissions 
           WHERE status='ACTIVE' AND end_date < CURDATE()) AS expiredPermissions
      `),

      // 6. Overdue homework notifications
      pool.execute(`
        SELECT 'Homework' AS type,
               CONCAT('Homework overdue — ', sub.name, ' ', COALESCE(ac.name, c.class_name)) AS message,
               h.due_date AS date
        FROM homework h
        LEFT JOIN academic_classes ac ON h.class_id = ac.id
        LEFT JOIN classes c ON h.class_id = c.id AND ac.id IS NULL
        JOIN subjects sub ON h.subject_id = sub.id
        WHERE h.due_date < CURDATE()
        ORDER BY h.due_date DESC
        LIMIT 5
      `),

      // 7. Pending leave notifications
      pool.execute(`
        SELECT 'Leave' AS type,
               CONCAT('Leave request from ', u.name) AS message,
               lr.applied_date AS date
        FROM leave_requests lr
        JOIN users u ON lr.user_id = u.id
        WHERE lr.status='Pending'
        ORDER BY lr.applied_date DESC
        LIMIT 5
      `),

      // 8. Weekly Syllabus by class+subject — uses academic_classes (correct table)
      pool.execute(`
        SELECT u.name AS teacher, ac.name AS class, '' AS section,
               sub.name AS subject,
               COUNT(*) AS total,
               SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completed,
               ROUND(COALESCE(AVG(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) * 100, 0)) AS pct
        FROM syllabus s
        JOIN academic_classes ac ON s.class_id = ac.id
        JOIN subjects sub ON s.subject_id = sub.id
        LEFT JOIN users u ON s.teacher_id = u.id
        GROUP BY u.name, ac.id, sub.id, ac.name, sub.name
        ORDER BY u.name, ac.name, sub.name
        LIMIT 30
      `),

      // 9. Student birthdays this month (upcoming)
      pool.execute(`
        SELECT s.name, 'Student' AS role,
               COALESCE(ac.name, c.class_name) AS class, 
               COALESCE(c.section, '') AS section,
               s.dob AS date
        FROM students s
        LEFT JOIN academic_classes ac ON s.class_id = ac.id
        LEFT JOIN classes c ON s.class_id = c.id AND ac.id IS NULL
        WHERE s.dob IS NOT NULL
          AND MONTH(s.dob) = MONTH(CURDATE())
          AND DAY(s.dob) >= DAY(CURDATE())
        ORDER BY DAY(s.dob) ASC
        LIMIT 10
      `),

      // 10. Teacher birthdays — safe JS-side filtering for string dob
      pool.execute(`
        SELECT u.name, 'Teacher' AS role, t.dob AS date
        FROM teachers t
        JOIN users u ON t.user_id = u.id
        WHERE t.dob IS NOT NULL AND t.dob != '' AND t.is_deleted = 0
      `),

      // 11. HW Tracking — show homework even without submissions (LEFT JOIN)
      pool.execute(`
        SELECT COALESCE(ac.name, c.class_name) AS class, 
               COALESCE(c.section, '') AS section, 
               sub.name AS subject,
               h.description, h.due_date, h.assigned_date,
               COALESCE(sub_counts.submitted, 0) AS submitted,
               COALESCE(sub_counts.pending, 0) AS pending,
               COALESCE(sub_counts.not_checked, 0) AS not_checked,
               CASE
                 WHEN h.due_date < CURDATE() THEN 'overdue'
                 WHEN COALESCE(sub_counts.submitted, 0) = 0 THEN 'pending'
                 WHEN COALESCE(sub_counts.not_checked, 0) > 0 THEN 'unchecked'
                 ELSE 'checked'
               END AS status
        FROM homework h
        LEFT JOIN academic_classes ac ON h.class_id = ac.id
        LEFT JOIN classes c ON h.class_id = c.id AND ac.id IS NULL
        LEFT JOIN subjects sub ON h.subject_id = sub.id
        LEFT JOIN (
          SELECT homework_id,
            SUM(CASE WHEN status='submitted' THEN 1 ELSE 0 END) AS submitted,
            SUM(CASE WHEN status='pending'   THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN score IS NULL AND status='submitted' THEN 1 ELSE 0 END) AS not_checked
          FROM homework_submissions
          GROUP BY homework_id
        ) sub_counts ON h.id = sub_counts.homework_id
        ORDER BY h.due_date DESC
        LIMIT 20
      `),

      // 12. Permissions expiring soon (within 14 days)
      pool.execute(`
        SELECT tmp.id, u.name AS teacher, m.module_name AS module,
               COALESCE(ac.name, c.class_name) AS class, sub.name AS subject,
               tmp.start_date, tmp.end_date, tmp.status,
               DATEDIFF(tmp.end_date, CURDATE()) AS daysLeft
        FROM teacher_module_permissions tmp
        JOIN teachers t ON tmp.teacher_id = t.id
        JOIN users u ON t.user_id = u.id
        JOIN modules m ON tmp.module_id = m.id
        LEFT JOIN academic_classes ac ON tmp.class_id = ac.id
        LEFT JOIN classes c ON tmp.class_id = c.id AND ac.id IS NULL
        LEFT JOIN subjects sub ON tmp.subject_id = sub.id
        WHERE tmp.status = 'ACTIVE'
          AND tmp.end_date >= CURDATE()
          AND tmp.end_date <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
        ORDER BY tmp.end_date ASC
      `),
    ]);

    // ── Process teacher birthdays (string dob formats) ─────────────────────
    const curM = new Date().getMonth() + 1;
    const curD = new Date().getDate();
    const validTBdays = teacherBdayRows.filter(t => {
      try {
        let d;
        const s = String(t.date).trim();
        if (s.includes('/')) {
          const [day, mon, yr] = s.split('/');
          d = new Date(`${yr}-${mon}-${day}`);
        } else if (s.includes('-')) {
          const parts = s.split('-');
          d = parts[0].length === 4 ? new Date(s) : new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        } else return false;
        if (isNaN(d.getTime())) return false;
        return (d.getMonth() + 1) === curM && d.getDate() >= curD;
      } catch { return false; }
    });

    const birthdays = [...studentBdayRows, ...validTBdays]
      .sort((a, b) => {
        const getDay = ds => { try { return new Date(ds).getDate() || 0; } catch { return 0; } };
        return getDay(a.date) - getDay(b.date);
      })
      .slice(0, 10);

    const management = managementRows[0] || {};
    const overview   = overviewRows[0]   || {};
    const notifications = [...overdueHomeworkRows, ...pendingLeaveRows]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalStudents:     overview.totalStudents     || 0,
          totalTeachers:     overview.totalTeachers     || 0,
          totalClasses:      overview.totalClasses      || 0,
          syllabusCompletion: Number(overview.syllabusCompletion || 0).toFixed(1),
        },
        events:           eventRows        || [],
        observations:     observationRows  || [],
        topPerformers:    topPerformerRows || [],
        management: {
          pendingHomework:    management.pendingHomework    || 0,
          incompleteSyllabus: management.incompleteSyllabus || 0,
          pendingLeaves:      management.pendingLeaves      || 0,
          expiredPermissions: management.expiredPermissions || 0,
        },
        notifications:    notifications    || [],
        weeklySyllabus:   syllabusRows     || [],
        birthdays:        birthdays        || [],
        hwTracking:       hwTrackingRows   || [],
        expiringPerms:    pendingPermRows  || [],
      }
    });

  } catch (error) {
    console.error("🔥 ADMIN METRICS CRASH:", error.sql || error.message);
    return res.status(500).json({
      success: false,
      message: 'Dashboard data fetch failed: ' + error.message,
      error: error.message,
      sql: error.sql,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


// ─── TEACHER DASHBOARD ───────────────────────────────────────────────────────
exports.getTeacherDashboard = async (req, res) => {
  const userId = req.user.id;

  try {
    const [
      [teacherRows],
      [assignmentsRows],
      [syllabusRows],
      [loRows],
      [observationRows],
      [permissionsRows],
      [leaveRows],
      [birthdayRows],
      [hwRows],
      [topPerformerRows],
    ] = await Promise.all([

      // 1. Teacher profile
      pool.execute(`
        SELECT u.id, u.name, u.email, u.phone,
               t.mobile, t.dob, t.qualification, t.experience, t.subject,
               t.id AS teacher_db_id
        FROM users u
        LEFT JOIN teachers t ON t.user_id = u.id
        WHERE u.id = ?
      `, [userId]),

      // 2. Teacher's class+subject assignments — resilient join
      pool.execute(`
        SELECT ts.id, 
               COALESCE(ac.name, c.class_name) AS class_name,
               COALESCE(c.section, '') AS section,
               ts.class_id,
               sub.name AS subject, sub.id AS subject_id
        FROM teacher_subjects ts
        LEFT JOIN academic_classes ac ON ts.class_id = ac.id
        LEFT JOIN classes c ON ts.class_id = c.id AND ac.id IS NULL
        JOIN subjects sub ON ts.subject_id = sub.id
        WHERE ts.teacher_id = ?
        ORDER BY COALESCE(ac.name, c.class_name), sub.name
      `, [userId]),

      // 3. Syllabus completion stats — tries academic_classes first (correct table),
      //    falls back to legacy classes via UNION so data always appears
      pool.execute(`
        SELECT
          COALESCE(ac.name, c.class_name) AS class_name,
          COALESCE(ac.name, c.class_name) AS class,
          '' AS section,
          sub.name AS subject,
          COUNT(*) AS total,
          SUM(s.is_completed) AS completed,
          ROUND(SUM(s.is_completed) / NULLIF(COUNT(*),0) * 100) AS pct
        FROM syllabus s
        LEFT JOIN academic_classes ac ON s.class_id = ac.id
        LEFT JOIN classes c ON s.class_id = c.id
        JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.teacher_id = ?
        GROUP BY s.class_id, sub.id, sub.name, COALESCE(ac.name, c.class_name)
        ORDER BY COALESCE(ac.name, c.class_name), sub.name
      `, [userId]),

      // 4. LO summary — dual-match: admin stores teachers.id, teacher reads by user_id
      pool.execute(`
        SELECT 
          SUM(CASE WHEN tpl.status='Approaching' THEN 1 ELSE 0 END) AS approaching,
          SUM(CASE WHEN tpl.status='Meeting'     THEN 1 ELSE 0 END) AS meeting,
          SUM(CASE WHEN tpl.status='Exceeding'   THEN 1 ELSE 0 END) AS exceeding,
          COUNT(*) AS total
        FROM teacher_performance_lo tpl
        LEFT JOIN teachers t ON tpl.teacher_id = t.id
        WHERE tpl.teacher_id = ? OR t.user_id = ?
      `, [userId, userId]),

      // 5. My observations — dual-match: admin stores teachers.id, teacher reads by user_id
      pool.execute(`
        SELECT o.id, o.observation_date, o.total_score, o.max_score,
               COALESCE(u.name, '—') AS observed_by,
               o.criteria_scores,
               ROUND((o.total_score / NULLIF(o.max_score, 0)) * 100) AS pct
        FROM observations o
        LEFT JOIN teachers t ON o.teacher_id = t.id
        LEFT JOIN users u ON o.observed_by = u.id
        WHERE o.teacher_id = ? OR t.user_id = ?
        ORDER BY o.observation_date DESC
        LIMIT 5
      `, [userId, userId]),

      // 6. Active permissions for this teacher
      pool.execute(`
        SELECT tmp.id, m.module_name AS action, m.module_key,
               c.class_name AS class, sub.name AS subject,
               tmp.start_date AS \`from\`, tmp.end_date AS \`to\`,
               tmp.status,
               DATEDIFF(tmp.end_date, CURDATE()) AS daysLeft
        FROM teacher_module_permissions tmp
        JOIN teachers t ON tmp.teacher_id = t.id
        JOIN modules m ON tmp.module_id = m.id
        LEFT JOIN classes c ON tmp.class_id = c.id
        LEFT JOIN subjects sub ON tmp.subject_id = sub.id
        WHERE t.user_id = ?
        ORDER BY tmp.end_date ASC
      `, [userId]),

      // 7. Leave summary
      pool.execute(`
        SELECT 
          SUM(CASE WHEN status='Approved' THEN 1 ELSE 0 END) AS approved,
          SUM(CASE WHEN status='Pending'  THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status='Rejected' THEN 1 ELSE 0 END) AS rejected,
          COUNT(*) AS total
        FROM leave_requests
        WHERE user_id = ?
      `, [userId]),

      // 8. Birthdays this week (students in teacher's classes)
      pool.execute(`
        SELECT s.name, 'Student' AS type, c.class_name AS class, c.section, s.dob AS date
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN teacher_subjects ts ON ts.class_id = c.id
        WHERE ts.teacher_id = ?
          AND s.dob IS NOT NULL
          AND MONTH(s.dob) = MONTH(CURDATE())
          AND DAY(s.dob) BETWEEN DAY(CURDATE()) AND DAY(DATE_ADD(CURDATE(), INTERVAL 7 DAY))
        ORDER BY DAY(s.dob) ASC
        LIMIT 10
      `, [userId]),

      // 9. Homework submission summary
      pool.execute(`
        SELECT h.id, h.description, c.class_name, c.section, sub.name AS subject,
               h.assigned_date, h.due_date,
               COUNT(hs.id) AS submitted,
               (SELECT COUNT(*) FROM students WHERE class_id = h.class_id) AS total
        FROM homework h
        JOIN classes c ON h.class_id = c.id
        JOIN subjects sub ON h.subject_id = sub.id
        LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.status='submitted'
        WHERE h.teacher_id = ?
        GROUP BY h.id, h.description, c.class_name, c.section, sub.name, h.assigned_date, h.due_date
        ORDER BY h.due_date DESC
        LIMIT 8
      `, [userId]),

      // 10. Top Performing Teachers (Global list)
      pool.execute(`
        SELECT
          u.id AS teacher_id,
          u.name AS teacher_name,
          COALESCE(AVG(tpl.teacher_score), 0) AS avg_teacher_score,
          COALESCE(AVG(tpl.principal_score), 0) AS avg_principal_score,
          ROUND(
            COALESCE(AVG(tpl.teacher_score), 0) * 0.7 +
            COALESCE(AVG(tpl.principal_score), 0) * 0.3
          , 1) AS weighted_score
        FROM teacher_performance_lo tpl
        LEFT JOIN teachers t ON tpl.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE u.id IS NOT NULL
        GROUP BY u.id, u.name
        ORDER BY weighted_score DESC
        LIMIT 5
      `),
    ]);

    const teacher = teacherRows[0] || {};
    const leaveSummary = leaveRows[0] || { approved: 0, pending: 0, rejected: 0, total: 0 };
    const loSummary    = loRows[0]    || { approaching: 0, meeting: 0, exceeding: 0, total: 0 };

    // Total syllabus stats
    const syllabusStats = syllabusRows.reduce(
      (acc, r) => ({ total: acc.total + r.total, completed: acc.completed + (r.completed || 0) }),
      { total: 0, completed: 0 }
    );
    syllabusStats.pct = syllabusStats.total > 0
      ? Math.round((syllabusStats.completed / syllabusStats.total) * 100) : 0;

    // --- NEW: Sync LO Distribution from Intelligence Engine ---
    const intel = require('./lmsIntelligenceController');
    const mockRes = { json: (data) => data };
    const intelData = await intel.getTeacherDashboard({ user: req.user }, mockRes);
    const loStats = intelData?.data?.lo || { approaching: 0, meeting: 0, exceeding: 0, total: 0 };

    return res.status(200).json({
      success: true,
      data: {
        profile: teacherRows[0] || {},
        assignments: assignmentsRows || [],
        syllabus: syllabusRows || [], 
        syllabusStatsByClass: syllabusRows || [], 
        loDistribution: loStats, // SYNCED DATA
        observations: observationRows || [],
        permissions: permissionsRows || [],
        leaves: leaveRows[0] || { approved: 0, pending: 0, rejected: 0, total: 0 },
        birthdays: birthdayRows || [],
        homework: hwRows || [],
        topPerformers: topPerformerRows || []
      }
    });

  } catch (error) {
    console.error('[TEACHER DASHBOARD ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Teacher dashboard fetch failed.', error: error.message });
  }
};

// ─── NOTIFICATIONS (Unified Tracking) ────────────────────────────────────────

exports.getHomeworkNotifications = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        mst.id as event_id,
        mst.class_number as class,
        mst.section_name as section,
        sub.name as subject,
        stu.name as student_name,
        u.name as teacher_name,
        mst.task_type,
        mst.topic,
        mst.status,
        DATE(mst.created_at) as date
      FROM micro_schedule_tracking mst
      JOIN students stu ON mst.student_id = stu.id
      JOIN subjects sub ON mst.subject_id = sub.id
      JOIN teachers t ON mst.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE mst.status = 'NOT_COMPLETED'
      GROUP BY stu.id, sub.id, mst.topic, mst.tracking_date
      ORDER BY mst.created_at DESC
    `);
    
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getHomeworkNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tracking data', error: err.message });
  }
};

const notificationEventService = require('../utils/notificationEventService');

exports.getNotifications = async (req, res) => {
  try {
    const role = req.query.role || req.user.role;
    const userId = req.user.id;
    
    // Trigger background checks
    if (role === 'admin' || role === 'principal') {
      await notificationEventService.checkExpiringPermissions();
    }

    const notifications = await notificationEventService.getNotificationsByRole(role, userId);
    
    const formatted = notifications.map(n => ({
      id: n.id,
      type: n.type,
      event_type: n.event_type,
      title: (n.event_type || n.type).split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      text: n.message,
      time: n.created_at,
      read: !!n.is_read,
      status: n.status || 'active'
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('[API getNotifications] Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: err.message });
  }
};
