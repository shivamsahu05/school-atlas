// src/controllers/teacherScheduleController.js
const pool = require('../config/mysqlDb');
const notificationEventService = require('../utils/notificationEventService');

// ─── 📅 TIMETABLE & SCHEDULE ──────────────────────────────────────────────────

/**
 * GET /api/teacher/schedule - Unified teacher schedule
 * Source: teacher_timetable + syllabus
 */
exports.getTeacherSchedule = async (req, res) => {
  const userId = req.user.id;
  const { class_number, section, subject_id } = req.query;

  try {
    const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (!teachers.length) return res.json({ success: true, data: [] });
    const teacherId = teachers[0].id;

    let sql = `
      SELECT
        tt.id, tt.day_of_week, tt.class_number, tt.section,
        COALESCE(syl.topic, tt.topic, 'No Topic') as topic, 
        COALESCE(syl.status, tt.status, 'Pending') as status,
        tt.room_number,
        COALESCE(syl.periods, 0) as periods,
        sub.name AS subject_name, sub.id AS subject_id,
        ts.start_time, ts.end_time, ts.is_break,
        ac.id AS class_id, asec.id AS section_id
      FROM teacher_timetable tt
      JOIN subjects sub ON tt.subject_id = sub.id
      JOIN time_slots ts ON tt.time_slot_id = ts.id
      LEFT JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
      LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
      LEFT JOIN syllabus syl ON (
        syl.teacher_id = tt.teacher_id
        AND syl.class_id = ac.id
        AND syl.section_id = asec.id
        AND syl.subject_id = tt.subject_id
      )
      WHERE tt.teacher_id = ?
    `;

    const params = [userId];
    if (class_number && class_number !== 'All') { sql += ' AND tt.class_number = ?'; params.push(class_number); }
    if (section && section !== 'All') { sql += ' AND tt.section = ?'; params.push(section); }
    if (subject_id && subject_id !== 'All') { sql += ' AND tt.subject_id = ?'; params.push(subject_id); }

    sql += ' ORDER BY FIELD(UPPER(tt.day_of_week), "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"), ts.start_time';

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[GET SCHEDULE ERROR]:', err);
    res.json({ success: true, data: [], error: err.message });
  }
};

/**
 * GET /api/teacher/timetable - Raw timetable grid
 */
exports.getMyTimetable = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        tt.id, UPPER(tt.day_of_week) as day,
        s.name AS subject_name, tt.subject_id,
        ac.class_number AS class_name, ac.id as class_id,
        asec.name AS section_name, asec.id as section_id,
        ts.start_time, ts.end_time, tt.room_number, tt.status,
        tt.time_slot_id as slot_id
      FROM teacher_timetable tt
      LEFT JOIN subjects s ON s.id = tt.subject_id
      LEFT JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
      LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
      LEFT JOIN time_slots ts ON ts.id = tt.time_slot_id
      WHERE tt.teacher_id = ?
      ORDER BY FIELD(UPPER(tt.day_of_week), 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'), ts.start_time
    `, [req.user.id]);


    const [timeSlots] = await pool.execute('SELECT * FROM time_slots ORDER BY start_time ASC');
    res.json({ success: true, data: rows, timeSlots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/teacher/schedule/assignments - Teaching assignments
 */
exports.getMyAssignments = async (req, res) => {
  try {
    let assignments = [];
    const targetTeacherId = req.query.teacher_id ? Number(req.query.teacher_id) : null;

    if (targetTeacherId) {
      const [rows] = await pool.execute(`
        SELECT DISTINCT
          ac.class_number as className,
          COALESCE(asec.code, tt.section) as sectionCode,
          s.name as subjectName
        FROM teacher_timetable tt
        JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
        LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
        JOIN subjects s ON tt.subject_id = s.id
        WHERE tt.teacher_id = ?
        ORDER BY className ASC, sectionCode ASC, subjectName ASC
      `, [targetTeacherId]);
      assignments = rows;
    } else if (req.user.role === 'admin') {
      const [rows] = await pool.execute(`
        SELECT DISTINCT classId, className, sectionId, sectionName, subjectId, subjectName
        FROM (
          SELECT DISTINCT 
            ac.id as classId, ac.class_number as className,
            asec.id as sectionId, asec.name as sectionName,
            s.id as subjectId, s.name as subjectName
          FROM teacher_timetable tt
          JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
          LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
          JOIN subjects s ON tt.subject_id = s.id
          WHERE ac.id IS NOT NULL AND s.id IS NOT NULL

          UNION

          SELECT DISTINCT 
            ac.id as classId, ac.class_number as className,
            asec.id as sectionId, asec.name as sectionName,
            s.id as subjectId, s.name as subjectName
          FROM syllabus sy
          JOIN academic_classes ac ON sy.class_id = ac.id
          LEFT JOIN acad_sections asec ON sy.section_id = asec.id
          JOIN subjects s ON sy.subject_id = s.id
          WHERE ac.id IS NOT NULL AND s.id IS NOT NULL
        ) as combined
        ORDER BY className ASC, sectionName ASC
      `);
      assignments = rows;
    } else {
      const [rows] = await pool.execute(`
        SELECT DISTINCT 
          classId, className, sectionId, sectionName, subjectId, subjectName
        FROM (
          -- SOURCE A: Timetable assignments (teacher_id stores users.id)
          SELECT 
            ac.id as classId, ac.class_number as className,
            asec.id as sectionId, asec.name as sectionName,
            s.id as subjectId, s.name as subjectName
          FROM teacher_timetable tt
          JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
          LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
          JOIN subjects s ON tt.subject_id = s.id
          WHERE tt.teacher_id = ?

          UNION

          -- SOURCE B: Manual Module Permissions (teacher_id stores teachers.id)
          SELECT 
            ac.id as classId, ac.class_number as className,
            asec.id as sectionId, asec.name as sectionName,
            s.id as subjectId, s.name as subjectName
          FROM teacher_module_permissions tmp
          JOIN academic_classes ac ON tmp.class_id = ac.id
          LEFT JOIN acad_sections asec ON tmp.section_id = asec.id
          JOIN subjects s ON tmp.subject_id = s.id
          JOIN teachers t ON tmp.teacher_id = t.id
          WHERE t.user_id = ? AND tmp.status = 'ACTIVE'

          UNION

          -- SOURCE C: Syllabus assignments where they are the assigned teacher
          SELECT 
            ac.id as classId, ac.class_number as className,
            asec.id as sectionId, asec.name as sectionName,
            s.id as subjectId, s.name as subjectName
          FROM syllabus sy
          JOIN academic_classes ac ON sy.class_id = ac.id
          LEFT JOIN acad_sections asec ON sy.section_id = asec.id
          JOIN subjects s ON sy.subject_id = s.id
          WHERE sy.teacher_id = ?
        ) as combined
        WHERE classId IS NOT NULL AND subjectId IS NOT NULL
        ORDER BY className ASC, sectionName ASC
      `, [req.user.id, req.user.id, req.user.id]);
      assignments = rows;
    }

    res.json({ success: true, data: { assignments, teacherId: req.user.id } });

  } catch (err) {
    console.error('[GET ASSIGNMENTS ERROR]:', err);
    res.json({ success: true, data: { assignments: [] }, error: err.message });
  }
};

/**
 * POST /api/teacher/schedule/update - Quick status update
 */
exports.updateScheduleStatus = async (req, res) => {
  const { id, status, topic } = req.body;
  try {
    await pool.execute(
      'UPDATE teacher_timetable SET status = ?, topic = ?, updated_at = NOW() WHERE id = ?',
      [status, topic, id]
    );
    res.json({ success: true, message: 'Status updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 📊 SYLLABUS & MICRO SCHEDULE ─────────────────────────────────────────────

/**
 * GET /api/teacher/schedule/micro-schedule
 */
exports.getMicroSchedule = async (req, res) => {
  const { class_id, section_id, subject_id, month, week } = req.query;
  try {
    let sql = `
      SELECT syl.*, syl.homework_status as homework_checked, ac.class_number, asec.name as section_name, sub.name as subject_name
      FROM syllabus syl
      JOIN academic_classes ac ON syl.class_id = ac.id
      JOIN acad_sections asec ON syl.section_id = asec.id
      JOIN subjects sub ON syl.subject_id = sub.id
      WHERE syl.class_id = ? AND syl.section_id = ? AND syl.subject_id = ?
    `;
    const params = [class_id, section_id, subject_id];
    if (month && month !== 'All') { sql += ' AND syl.month = ?'; params.push(month); }
    if (week && week !== 'All') { sql += ' AND syl.week = ?'; params.push(week); }

    const [rows] = await pool.execute(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.json({ success: true, data: [], error: err.message });
  }
};

/**
 * POST /api/teacher/schedule/micro-schedule - MASTER SYNC (Rule-Driven)
 */
exports.saveMicroSchedule = async (req, res) => {
  const payload = req.body;
  const items = Array.isArray(payload) ? payload : [payload];
  if (!items.length) return res.json({ success: false, message: 'No data' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const [teachers] = await connection.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    const loggedInTeacherId = teachers.length > 0 ? teachers[0].id : null;

    for (const item of items) {
      const { 
        syllabus_id, class_number, section, subject_id, month, week,
        topic, periods_planned, learning_status, class_understanding_level,
        learning_outcome, notebook_checked, homework_checked, students_status
      } = item;

      const finalStatusRaw = (item.status || learning_status || 'pending').toLowerCase();
      const isFinishing = finalStatusRaw === 'completed';

      let finalTeacherId = loggedInTeacherId;
      if (!finalTeacherId) {
        if (syllabus_id) {
          const [sylRows] = await connection.execute('SELECT teacher_id FROM syllabus WHERE id = ?', [syllabus_id]);
          if (sylRows.length > 0 && sylRows[0].teacher_id) {
            const [tRows] = await connection.execute('SELECT id FROM teachers WHERE user_id = ?', [sylRows[0].teacher_id]);
            if (tRows.length > 0) finalTeacherId = tRows[0].id;
          }
        }
        if (!finalTeacherId) {
          const [ttRows] = await connection.execute(`
            SELECT tt.teacher_id 
            FROM teacher_timetable tt
            WHERE tt.subject_id = ? AND tt.class_number = ? AND tt.section = ?
            LIMIT 1
          `, [Number(subject_id), class_number, section || '']);
          if (ttRows.length > 0) {
            const [tRows] = await connection.execute('SELECT id FROM teachers WHERE user_id = ?', [ttRows[0].teacher_id]);
            if (tRows.length > 0) finalTeacherId = tRows[0].id;
          }
        }
        if (!finalTeacherId) {
          const [anyTeacher] = await connection.execute('SELECT id FROM teachers LIMIT 1');
          finalTeacherId = anyTeacher.length > 0 ? anyTeacher[0].id : 1;
        }
      }

      // 1. UPDATE SYLLABUS (ID-BASED SSOT)
      if (syllabus_id) {
        const finalIsCompleted = isFinishing ? 1 : 0;
        const finalStatus = isFinishing ? 'completed' : (finalStatusRaw.includes('progress') ? 'in_progress' : 'pending');
        const incomingPeriods = Number(periods_planned || 0);

        await connection.execute(
          `UPDATE syllabus SET 
             status = ?, 
             is_completed = ?, 
             completed_date = CASE 
               WHEN ? = 1 AND completed_date IS NULL THEN CURDATE() 
               WHEN ? = 0 THEN NULL 
               ELSE completed_date 
             END,
             periods = COALESCE(periods, 0) + ?, 
             periods_needed = COALESCE(periods_needed, 0) + ?,
             learning_outcome = ?, 
             notebook_checked = ?, 
             homework_status = ?,
             class_understanding_level = ?, 
             updated_at = NOW()
           WHERE id = ?`,
          [
            finalStatus, 
            finalIsCompleted, 
            finalIsCompleted, 
            finalIsCompleted, 
            incomingPeriods, 
            incomingPeriods,
            learning_outcome || null, 
            notebook_checked || 'No', 
            homework_checked || 'Incomplete',
            finalIsCompleted ? class_understanding_level : null, 
            syllabus_id
          ]
        );
        console.log(`[STRICT SSOT] ID: ${syllabus_id} | Status: ${finalStatus} | Added Periods: ${incomingPeriods}`);
      }

      // 2. LEGACY MICRO_SCHEDULE SYNC
      const msStatus = isFinishing ? 'Completed' : (finalStatusRaw.includes('progress') ? 'In Progress' : 'Pending');
      await connection.execute(`
        INSERT INTO micro_schedule (teacher_id, class_number, section, subject_id, month, week, topic, periods_planned, learning_status, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE topic=VALUES(topic), learning_status=VALUES(learning_status)
      `, [finalTeacherId, class_number, section || '', Number(subject_id), month, week, topic || '', Number(periods_planned || 0), msStatus, isFinishing ? new Date() : null]);

      // 3. STUDENT DATA SYNC (Dual Persistence: JSON for reporting + Relational for tracking)
      if (syllabus_id && students_status && Array.isArray(students_status)) {
        // A. Update JSON blob in syllabus table (for analytics/reporting)
        const [allStudents] = await connection.execute('SELECT id, name, roll_no FROM students WHERE status = "Active"');
        const studentsData = students_status.map(ss => {
          const s = allStudents.find(st => st.id == ss.student_id);
          return { 
            id: Number(ss.student_id), 
            name: s?.name || 'Unknown', 
            rollNumber: s?.roll_no || 'N/A', 
            learning_status: ss.lo_status || 'Meeting', 
            homework: ss.homework_status === 'COMPLETED' || ss.homework === true, 
            notebook: ss.notebook === true
          };
        });
        await connection.execute('UPDATE syllabus SET students_data = ? WHERE id = ?', [JSON.stringify(studentsData), syllabus_id]);

        // B. Update Relational micro_schedule_student_status table (for the Tracker Modal)
        for (const ss of students_status) {
          const hwDone = (ss.homework_status === 'COMPLETED' || ss.homework === true) ? 1 : 0;
          const nbDone = (ss.notebook === true || ss.notebook === 1) ? 1 : 0;
          
          await connection.execute(
            `INSERT INTO micro_schedule_student_status 
              (syllabus_id, student_id, homework_completed, notebook_checked) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
              homework_completed = VALUES(homework_completed), 
              notebook_checked = VALUES(notebook_checked)`,
            [syllabus_id, ss.student_id, hwDone, nbDone]
          );
        }
      }
    }
    await connection.commit();
    res.json({ success: true, message: 'Saved successfully.' });
  } catch (err) {
    if (connection) await connection.rollback();
    res.json({ success: true, message: 'Recovered: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ─── 👥 STUDENT TRACKING ──────────────────────────────────────────────────────

exports.getItemStudents = async (req, res) => {
  const { itemId } = req.params;
  const { class_id, section_id } = req.query;
  try {
    // If students have section_id as null, they should still appear in the class list.
    // class_id in students table usually refers to the academic_classes ID.
    const [rows] = await pool.execute(`
      SELECT id, name, roll_no 
      FROM students 
      WHERE class_id = ? 
        AND (section_id = ? OR section_id IS NULL OR section_id = 0)
        AND status = 'Active'
      ORDER BY CAST(roll_no AS UNSIGNED) ASC
    `, [class_id, section_id]);

    const [saved] = await pool.execute('SELECT student_id, homework_completed, notebook_checked FROM micro_schedule_student_status WHERE syllabus_id = ?', [itemId]);
    const statusMap = {}; saved.forEach(s => statusMap[s.student_id] = s);
    res.json(rows.map(st => ({ 
      id: st.id, 
      name: st.name, 
      roll_no: st.roll_no, 
      // If not in statusMap, it means never saved for this topic -> Default to 1 (Done)
      done: statusMap[st.id] !== undefined ? (statusMap[st.id].homework_completed ? 1 : 0) : 1, 
      notebook: statusMap[st.id] !== undefined ? (statusMap[st.id].notebook_checked ? 1 : 0) : 1 
    })));
  } catch (err) { 
    console.error('[GET ITEM STUDENTS ERROR]:', err);
    res.status(500).json({ message: err.message }); 
  }
};

exports.saveStudentStatus = async (req, res) => {
  const { itemId } = req.params;
  const { students } = req.body;
  try {
    for (const s of students) {
      await pool.execute(
        'INSERT INTO micro_schedule_student_status (syllabus_id, student_id, homework_completed, notebook_checked) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE homework_completed=VALUES(homework_completed), notebook_checked=VALUES(notebook_checked)',
        [itemId, s.id, s.done, s.notebook]
      );
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ─── 👤 TEACHER PROFILE ───────────────────────────────────────────────────────

exports.getTeacherProfile = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT u.id, u.name, u.email, u.phone, t.* FROM users u LEFT JOIN teachers t ON u.id = t.user_id WHERE u.id = ?', [req.user.id]);
    res.json({ success: true, data: rows[0] || {} });
  } catch (err) { res.json({ success: true, data: {}, error: err.message }); }
};

exports.updateTeacherProfile = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { mobile, dob, qualification, experience, address } = req.body;
    if (mobile) await connection.execute('UPDATE users SET phone = ? WHERE id = ?', [mobile, req.user.id]);
    const [existing] = await connection.execute('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (existing.length > 0) {
      await connection.execute('UPDATE teachers SET mobile=?, dob=?, qualification=?, experience=?, address=? WHERE user_id=?', [mobile, dob, qualification, experience, address, req.user.id]);
    } else {
      await connection.execute('INSERT INTO teachers (user_id, mobile, dob, qualification, experience, address) VALUES (?,?,?,?,?,?)', [req.user.id, mobile, dob, qualification, experience, address]);
    }
    await connection.commit(); res.json({ success: true, message: 'Profile updated.' });
  } catch (err) { if (connection) await connection.rollback(); res.status(500).json({ success: false, message: err.message }); } finally { connection.release(); }
};

// ─── 🏛️ ADMIN TIMETABLE MANAGEMENT ────────────────────────────────────────────

exports.getAdminTimetable = async (req, res) => {
  const { class_number, section, day } = req.query;
  try {
    let sql = `
      SELECT tt.*, s.name as subject, ts.start_time, ts.end_time, u.name as teacher_name 
      FROM teacher_timetable tt 
      JOIN subjects s ON tt.subject_id = s.id 
      JOIN time_slots ts ON tt.time_slot_id = ts.id 
      JOIN users u ON tt.teacher_id = u.id 
      WHERE 1=1
    `;
    const params = [];
    if (class_number) { sql += ' AND tt.class_number = ?'; params.push(class_number); }
    if (section) { sql += ' AND tt.section = ?'; params.push(section); }
    if (day) { sql += ' AND UPPER(tt.day_of_week) = ?'; params.push(day.toUpperCase()); }
    const [rows] = await pool.execute(sql, params); res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.createTimetableEntry = async (req, res) => {
  const { teacher_id, class_number, section, subject_id, time_slot_id, day_of_week, room_number } = req.body;
  try {
    await pool.execute('INSERT INTO teacher_timetable (teacher_id, class_number, section, subject_id, time_slot_id, day_of_week, room_number, updated_at) VALUES (?,?,?,?,?,?,?, NOW())', [teacher_id, class_number, section || "", subject_id, time_slot_id, day_of_week.toUpperCase(), room_number || null]);
    res.status(201).json({ success: true, message: 'Timetable entry created.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteTimetableEntry = async (req, res) => {
  try { await pool.execute('DELETE FROM teacher_timetable WHERE id = ?', [req.params.id]); res.json({ success: true, message: 'Entry removed.' }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getTeacherSubjects = async (req, res) => {
  try {
    const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    const [rows] = await pool.execute('SELECT DISTINCT s.id, s.name FROM subjects s JOIN teacher_module_permissions tmp ON tmp.subject_id = s.id WHERE tmp.teacher_id = ? AND tmp.status = "ACTIVE"', [teachers[0].id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.json({ success: true, data: [] }); }
};
