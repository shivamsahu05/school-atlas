// src/controllers/teacherScheduleController.js
const pool = require('../config/mysqlDb');
const notificationEventService = require('../utils/notificationEventService');

exports.getTeacherSchedule = async (req, res) => {
  const userId = req.user.id;
  const { class_number, section, subject_id, start_date, end_date, month, week_label } = req.query;

  try {
    // 1. Get Teacher ID
    let teacherId = null;
    const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (teachers.length > 0) {
      teacherId = teachers[0].id;
    } else {
      return res.status(404).json({ success: false, message: 'Teacher profile not found.' });
    }

    let sql = `
      SELECT
        tt.id, 
        syl.id as syllabus_id,
        UPPER(tt.day_of_week) as day_of_week, 
        tt.class_number, 
        tt.section,
        COALESCE(syl.topic, tt.topic) as topic, 
        CASE 
          WHEN syl.id IS NOT NULL THEN (CASE WHEN syl.is_completed = 1 THEN 'Completed' ELSE 'Pending' END)
          ELSE tt.status 
        END as status,
        tt.room_number,
        COALESCE(syl.students_data, tt.students_data) as students_data,
        syl.planned_start_date,
        syl.planned_end_date,
        s.name  AS subject_name,
        s.id    AS subject_id,
        ts.start_time, 
        ts.end_time, 
        ts.is_break,
        ts.id   AS slot_id,
        ac.id   AS class_id,
        asec.id AS section_id
      FROM teacher_timetable tt
      JOIN subjects    s  ON tt.subject_id   = s.id
      JOIN time_slots  ts ON tt.time_slot_id = ts.id
      LEFT JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
      LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
      LEFT JOIN syllabus syl ON (
        syl.class_id = ac.id 
        AND syl.section_id = asec.id
        AND syl.subject_id = tt.subject_id 
        AND (
          (? IS NOT NULL AND REPLACE(LOWER(syl.week), ' ', '') = REPLACE(LOWER(?), ' ', ''))
          OR
          (? IS NOT NULL AND ? IS NOT NULL AND syl.planned_start_date BETWEEN ? AND ?)
          OR 
          (? IS NOT NULL AND MONTHNAME(syl.planned_start_date) = ?)
          OR
          (? IS NULL AND ? IS NULL AND ? IS NULL AND ? IS NULL)
        )
      )
      WHERE tt.teacher_id = ?
    `;
    const params = [
      week_label || null, week_label || null,
      start_date || null, end_date || null, start_date || null, end_date || null,
      month || null, month || null,
      week_label || null, start_date || null, end_date || null, month || null,
      teacherId
    ];

    if (class_number && class_number !== 'All') {
      sql += ' AND tt.class_number = ?';
      params.push(class_number);
    }
    if (section && section !== 'All') {
      sql += ' AND tt.section = ?';
      params.push(section);
    }
    if (subject_id && subject_id !== 'All') {
      sql += ' AND tt.subject_id = ?';
      params.push(subject_id);
    }

    sql += ` ORDER BY
        FIELD(UPPER(tt.day_of_week), 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'),
        ts.start_time`;

    const [rows] = await pool.execute(sql, params);

    return res.status(200).json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error('[SCHEDULE ERROR]:', err);
    return res.status(500).json({ success: false, data: [], message: 'Internal server error.', error: err.message });
  }
};

exports.updateScheduleStatus = async (req, res) => {
  const { id, status, topic, students_data } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, data: [], message: 'Period ID is required.' });
  }

  try {
    const updates = [];
    const values = [];

    if (status !== undefined) { updates.push('status=?'); values.push(status); }
    if (topic !== undefined) { updates.push('topic=?'); values.push(topic); }
    if (students_data !== undefined) { updates.push('students_data=?'); values.push(JSON.stringify(students_data)); }

    if (updates.length === 0) return res.json({ success: true, message: 'No changes.' });

    const sql = `UPDATE teacher_timetable SET ${updates.join(', ')}, updated_at=NOW() WHERE id=?`;
    values.push(id);

    await pool.execute(sql, values);

    return res.json({ success: true, data: [], message: 'Schedule updated successfully.' });
  } catch (err) {
    console.error('[SCHEDULE UPDATE ERROR]:', err);
    return res.status(500).json({ success: false, data: [], message: err.message });
  }
};

exports.getAdminTimetable = async (req, res) => {
  const { class_number, section, day } = req.query;
  try {
    let sql = `
      SELECT
        tt.id, tt.day_of_week, tt.class_number, tt.section, tt.status, tt.topic, tt.room_number,
        s.name  AS subject,
        ts.start_time, ts.end_time, ts.is_break,
        u.name  AS teacher_name
      FROM teacher_timetable tt
      JOIN subjects   s  ON tt.subject_id   = s.id
      JOIN time_slots ts ON tt.time_slot_id = ts.id
      JOIN teachers   t  ON tt.teacher_id   = t.id
      JOIN users      u  ON t.user_id        = u.id
      WHERE 1=1
    `;
    const params = [];
    if (class_number) { sql += ' AND tt.class_number = ?'; params.push(class_number); }
    if (section) { sql += ' AND tt.section = ?'; params.push(section); }
    if (day) { sql += ' AND UPPER(tt.day_of_week) = ?'; params.push(day.toUpperCase()); }
    
    sql += ' ORDER BY FIELD(UPPER(tt.day_of_week),"MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"), ts.start_time';

    const [rows] = await pool.execute(sql, params);
    
    console.log("ROWS:", rows.length);
    
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, data: [], message: err.message });
  }
};

exports.createTimetableEntry = async (req, res) => {
  const { teacher_id, class_number, section, subject_id, time_slot_id, day_of_week, room_number } = req.body;
  if (!teacher_id || !class_number || !subject_id || !time_slot_id || !day_of_week) {
    return res.status(400).json({ success: false, data: [], message: 'Missing required fields.' });
  }
  const finalSection = section ? String(section) : "";
  try {
    const [result] = await pool.execute(`
      INSERT INTO teacher_timetable
        (teacher_id, class_number, section, subject_id, time_slot_id, day_of_week, room_number, updated_at)
      VALUES (?,?,?,?,?,?,?, NOW())
    `, [teacher_id, class_number, finalSection, subject_id, time_slot_id, day_of_week.toUpperCase(), room_number || null]);
    return res.status(201).json({ success: true, data: [{ id: result.insertId }], message: 'Timetable entry created.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, data: [], message: 'Slot already occupied.' });
    return res.status(500).json({ success: false, data: [], message: err.message });
  }
};

exports.deleteTimetableEntry = async (req, res) => {
  try {
    await pool.execute('DELETE FROM teacher_timetable WHERE id = ?', [req.params.id]);
    return res.json({ success: true, data: [], message: 'Entry removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, data: [], message: err.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Teacher ID (User ID):", userId);

    // 1. Fetch Teacher ID from Users
    let teacherId = null;
    const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (teachers.length > 0) {
      teacherId = teachers[0].id;
    } else {
      return res.status(404).json({ success: false, data: { classes: [], subjects: [] }, message: 'Teacher profile not found.' });
    }

    // 2. Fetch unique classes from teacher_timetable
    const [classes] = await pool.execute(`
      SELECT DISTINCT 
        ac.id as class_id,
        asec.id as section_id,
        tt.class_number, 
        tt.section
      FROM teacher_timetable tt
      JOIN academic_classes ac ON (tt.class_number = ac.class_number OR tt.class_number = ac.name)
      LEFT JOIN acad_sections asec ON (tt.section = asec.name OR tt.section = asec.code)
      WHERE tt.teacher_id = ?
      ORDER BY tt.class_number ASC, tt.section ASC
    `, [teacherId]);

    // 3. Fetch unique subjects assigned to teacher for each class from teacher_module_permissions
    const [subjects] = await pool.execute(`
      SELECT DISTINCT 
        s.id AS subject_id, 
        s.name,
        tmp.class_id,
        tmp.section_id
      FROM teacher_module_permissions tmp
      JOIN subjects s ON tmp.subject_id = s.id
      WHERE tmp.teacher_id = ? AND tmp.status = 'ACTIVE'
      AND CURDATE() BETWEEN tmp.start_date AND tmp.end_date
      ORDER BY s.name ASC
    `, [teacherId]);

    console.log("Timetable Derived Classes:", classes);
    console.log("Timetable Derived Subjects:", subjects);

    return res.status(200).json({ 
      success: true, 
      data: { classes, subjects, teacherId } 
    });
  } catch (err) {
    console.error('[ASSIGNMENTS ERROR]:', err);
    return res.status(500).json({ success: false, data: { classes: [], subjects: [] }, message: err.message });
  }
};

exports.getMicroSchedule = async (req, res) => {
  const userId = req.user.id;
  
  let { 
    class_id, 
    section_id, 
    subject_id, 
    month = 'All', 
    week = 'All' 
  } = req.query || {};

  try {
    const cId = Number(class_id);
    const sId = Number(subject_id);
    const reqSecId = Number(section_id);

    console.log('[DEBUG getMicroSchedule] Received Params:', { class_id, section_id, subject_id, month, week });
    console.log('[DEBUG getMicroSchedule] Mapped IDs:', { cId, sId, reqSecId });

    if (!cId || !sId) {
      console.log('[DEBUG getMicroSchedule] Missing cId or sId. Returning empty.');
      return res.status(200).json({
        success: true,
        data: { savedData: null, timetable: [], students: [] }
      });
    }

    const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (!teachers || teachers.length === 0) {
      console.log('[DEBUG getMicroSchedule] Teacher profile not found for userId:', userId);
      return res.status(200).json({ success: false, data: { savedData: null, timetable: [], students: [] }, message: 'Teacher profile missing' });
    }
    const teacherId = teachers[0].id;

    // Get class info to map IDs to names/numbers
    const [classDetails] = await pool.execute('SELECT class_name, section FROM classes WHERE id = ?', [cId]);
    const classInfo = classDetails[0] || { class_name: '', section: '' };
    const classNum = classInfo.class_name.replace(/Class\s+/i, '');
    const secLetter = classInfo.section.replace(/section\s+/i, '');

    // Build dynamic query for syllabus topics (real source of truth)
    // NOTE: syllabus table doesn't have 'month' column, we derive it from planned_start_date
    const conditions = ['s.class_id = ?', 's.subject_id = ?'];
    const params = [cId, sId];
    
    if (reqSecId) {
      conditions.push('s.section_id = ?');
      params.push(reqSecId);
    }

    const query = `
      SELECT 
        s.id, s.topic, s.week, s.chapter,
        MONTHNAME(s.planned_start_date) as month,
        s.periods_needed as periods_planned,
        s.is_completed, s.completed_date, s.updated_at,
        CASE WHEN s.is_completed = 1 THEN 'Completed' ELSE 'Pending' END as status,
        s.learning_status,
        s.homework_status as homework,
        s.students_data,
        ac.class_number, sub.name as subject,
        s.class_id, s.section_id, s.subject_id
      FROM syllabus s
      JOIN academic_classes ac ON s.class_id = ac.id
      JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.class_id = ? AND s.subject_id = ? ${reqSecId ? 'AND s.section_id = ?' : ''}
      ORDER BY s.id ASC
    `;

    const sqlParams = [cId, sId, ...(reqSecId ? [reqSecId] : [])];
    console.log('[DEBUG getMicroSchedule] Executing SQL:', query);
    console.log('[DEBUG getMicroSchedule] SQL Params:', sqlParams);

    const [rows] = await pool.execute(query, sqlParams);
    console.log(`[DEBUG getMicroSchedule] Retrieved ${rows.length} rows from syllabus table.`);
    
    // Fallback is no longer needed as we fetch all by default
    let results = rows;

    // 3. FETCH ACTIVE STUDENTS FOR AUTO-LOADING
    const [classStudents] = await pool.execute(
      'SELECT id, name, roll_no as rollNumber FROM students WHERE class_id = ? AND section_id = ? AND status = "Active"',
      [cId, reqSecId]
    );

    // Normalize students data for each row
    const processedRows = rows.map(row => {
      let students = [];
      try {
        students = row.students_data ? (typeof row.students_data === 'string' ? JSON.parse(row.students_data) : row.students_data) : [];
      } catch (e) {
        console.error('Error parsing students_data:', e);
      }

      // If no student data saved for this topic yet, fallback to class students
      if (students.length === 0) {
        students = classStudents.map(s => ({
          ...s,
          homework: true, // Default to true
          notebook: true  // Default to true
        }));
      }

      return {
        ...row,
        students
      };
    });

    // ALWAYS RETURN FLAT ARRAY in 'data'
    return res.status(200).json({
      success: true,
      data: processedRows || []
    });

  } catch (err) {
    console.error('[SQL ERROR] getMicroSchedule Failure:', err);
    return res.status(500).json({ success: false, data: null, message: 'Database query failed', error: err.message });
  }
};

exports.saveMicroSchedule = async (req, res) => {
  const payload = req.body;
  console.log("[saveMicroSchedule] Payload received:", JSON.stringify(payload, null, 2));

  // Support both single object and array of objects
  const items = Array.isArray(payload) ? payload : [payload];

  if (items.length === 0) {
    return res.status(400).json({ success: false, message: 'No data provided to save.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const [teachers] = await connection.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    
    if (teachers.length === 0) {
      throw new Error('Teacher record not found for logged-in user.');
    }
    const teacherId = teachers[0].id;

    for (const item of items) {
      const { 
        class_number, section, subject_id, month, week,
        topic, periods_planned, periods_completed, learning_status, homework,
        students_status, syllabus_id, is_completed, completed_date
      } = item;

      // VALIDATION: Skip if essential fields are missing for this specific item
      if (!class_number || !subject_id || !month || !week) {
        console.warn(`[saveMicroSchedule] Skipping item due to missing fields:`, item);
        continue;
      }

      // 1. Save/Update Topic-level data in micro_schedule
      const isCompleted = (learning_status === 'Completed' || item.status === 'completed' || is_completed) ? 1 : 0;
      
      await connection.execute(`
        INSERT INTO micro_schedule (
          teacher_id, class_number, section, subject_id, month, week,
          topic, periods_planned, periods_completed, learning_status, homework,
          completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          topic=VALUES(topic), 
          periods_planned=VALUES(periods_planned),
          periods_completed=VALUES(periods_completed),
          learning_status=VALUES(learning_status),
          homework=VALUES(homework),
          completed_at = CASE 
            WHEN VALUES(learning_status) = 'Completed' AND completed_at IS NULL THEN CURDATE()
            WHEN VALUES(learning_status) != 'Completed' THEN NULL
            ELSE completed_at
          END
      `, [
        teacherId, class_number, section || '', Number(subject_id), month, week,
        topic || '', periods_planned || 0, periods_completed || 0, learning_status || 'Pending', homework || 'Pending',
        isCompleted ? new Date().toISOString().split('T')[0] : null
      ]);

      const [msRows] = await connection.execute(
        'SELECT id FROM micro_schedule WHERE teacher_id=? AND class_number=? AND section=? AND subject_id=? AND month=? AND week=?',
        [teacherId, class_number, section || '', Number(subject_id), month, week]
      );
      const microScheduleId = msRows[0]?.id;

      // 2. Save/Update Student-level status
      if (microScheduleId && students_status && Array.isArray(students_status)) {
        for (const student of students_status) {
          const status = student.homework_status || (student.homework ? 'COMPLETED' : 'PENDING');
          await connection.execute(`
            INSERT INTO micro_schedule_student_status (schedule_id, student_id, status)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status)
          `, [microScheduleId, student.student_id, status]);

          // NEW: Tracking table for Admin Dashboard sync
          const trackingStatus = (status === 'COMPLETED' || student.homework === true) ? 'COMPLETED' : 'NOT_COMPLETED';
          
          if (trackingStatus === 'NOT_COMPLETED') {
            await connection.execute(`
              INSERT INTO micro_schedule_tracking (
                class_id, section_id, class_number, section_name, subject_id, student_id, teacher_id, 
                task_type, topic, status, remarks, tracking_date, created_at
              ) VALUES (
                (SELECT class_id FROM students WHERE id = ?),
                (SELECT section_id FROM students WHERE id = ?),
                ?, ?, ?, ?, ?, 'Homework', ?, ?, ?, CURDATE(), NOW()
              )
              ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()
            `, [
              student.student_id, student.student_id,
              class_number, section || '', Number(subject_id), student.student_id, teacherId, 
              topic || 'Routine Homework', trackingStatus, ''
            ]);
          } else {
            // If they later marked it completed, we'll update it to COMPLETED so it disappears from the NOT_COMPLETED list
            await connection.execute(`
              UPDATE micro_schedule_tracking 
              SET status = 'COMPLETED', updated_at = NOW()
              WHERE student_id = ? AND subject_id = ? AND topic = ? AND tracking_date = CURDATE() AND task_type = 'Homework'
            `, [student.student_id, Number(subject_id), topic || 'Routine Homework']);
          }
        }
      }

      // Trigger homework backlog alert after the loop (Aggregated via Event Engine)
      if (class_id && subject_id && topic) {
        const [incompleteStudents] = await connection.execute(`
          SELECT s.name 
          FROM micro_schedule_tracking mst
          JOIN students s ON mst.student_id = s.id
          WHERE mst.class_id = ? AND mst.subject_id = ? AND mst.topic = ? AND mst.status = 'NOT_COMPLETED' AND mst.tracking_date = CURDATE()
        `, [class_id, subject_id, topic]);

        if (incompleteStudents.length > 0) {
          const studentNames = incompleteStudents.map(s => s.name).join(', ');
          
          // Fetch names for the message
          const [meta] = await connection.execute(`
            SELECT ac.class_number, sub.name as subjectName 
            FROM academic_classes ac, subjects sub 
            WHERE ac.id = ? AND sub.id = ?
          `, [class_id, subject_id]);

          await notificationEventService.emitNotification('homework_backlog_detected', {
            classId: class_id,
            className: meta[0]?.class_number,
            subjectId: subject_id,
            subjectName: meta[0]?.subjectName,
            topic: topic,
            studentCount: incompleteStudents.length,
            studentNames: studentNames
          });
        }
      }

      // 3. Update Syllabus table (MAIN Source of Truth)
      if (syllabus_id) {
        const [allStudents] = await connection.execute(
          'SELECT id, name, roll_no as rollNumber FROM students WHERE status = "Active"'
        );
        
        const studentsData = (students_status || []).map(ss => {
          const student = allStudents.find(s => s.id == ss.student_id);
          // Use student-specific lo_status or fallback to topic learning_status
          const studentLoStatus = ss.lo_status || learning_status || 'Meeting';
          
          return {
            id: Number(ss.student_id),
            name: student?.name || 'Unknown',
            rollNumber: student?.rollNumber || 'N/A',
            learning_status: studentLoStatus, // CRITICAL: Sync for LO Distribution
            homework: ss.homework_status === 'COMPLETED' || ss.homework === true,
            notebook: ss.notebook === true || true 
          };
        });

        const finalIsCompleted = (learning_status === 'Completed' || item.status === 'completed' || is_completed) ? 1 : 0;
        const finalStatus = finalIsCompleted ? 'completed' : (learning_status === 'In Progress' ? 'in_progress' : 'pending');
        
        // Fetch existing completion date to "lock" it
        const [existing] = await connection.execute('SELECT completed_date FROM syllabus WHERE id = ?', [syllabus_id]);
        let finalCompletedDate = existing[0]?.completed_date;

        if (finalIsCompleted) {
          if (!finalCompletedDate) {
            finalCompletedDate = new Date().toISOString().split('T')[0];
          }
        } else {
          finalCompletedDate = null;
        }

        await connection.execute(
          `UPDATE syllabus SET 
            students_data = ?, 
            is_completed = ?, 
            status = ?,
            completed_date = ?, 
            periods_needed = ?,
            learning_status = ?,
            homework_status = ?,
            updated_at = NOW() 
           WHERE id = ?`,
          [
            JSON.stringify(studentsData), 
            finalIsCompleted, 
            finalStatus,
            finalCompletedDate, 
            periods_planned || 0,
            learning_status || 'Pending',
            homework || 'Pending',
            syllabus_id
          ]
        );
        console.log(`[saveMicroSchedule] Sync Success: Syllabus ID ${syllabus_id} -> ${finalStatus}`);

        // Emit Syllabus Update Event
        await notificationEventService.emitNotification('syllabus_updated', {
          teacherId: teacherId,
          teacherName: req.user.name,
          syllabusId: syllabus_id,
          className: class_number
        });
      }
    }

    await connection.commit();
    console.log('[saveMicroSchedule] Batch transaction committed');
    res.json({ success: true, message: 'All changes saved successfully.' });

    // Trigger Intelligence Engine
    setImmediate(async () => {
      try {
        const intel = require('./lmsIntelligenceController');
        if (intel && intel.runIntelligenceEngine) {
          await intel.runIntelligenceEngine({ user: req.user }, { json: () => {} });
        }
      } catch (e) { console.error('Intelligence trigger failed:', e); }
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[saveMicroSchedule] CRITICAL ERROR:', err);
    res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
  } finally {
    if (connection) connection.release();
  }
};


exports.getTeacherSubjects = async (req, res) => {
  const userId = req.user.id;
  const { class_id } = req.query;

  try {
    let teacherId = null;
    const [teachers] = await pool.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (teachers.length > 0) teacherId = teachers[0].id;
    else return res.status(404).json({ success: false, message: 'Teacher profile not found.' });

    const [rows] = await pool.execute(`
      SELECT DISTINCT s.id, s.name
      FROM subjects s
      JOIN teacher_module_permissions tmp ON tmp.subject_id = s.id
      WHERE tmp.teacher_id = ? AND tmp.class_id = ? AND tmp.status = 'ACTIVE'
    `, [teacherId, class_id]);

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getTeacherProfile = async (req, res) => {
  try {
    console.log(`[PROFILE FETCH] User ID: ${req.user.id}`);
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
             t.mobile, t.dob, t.qualification, t.experience, t.subject, t.address
      FROM users u
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.id = ?
    `, [req.user.id]);

    if (rows.length === 0) {
      console.warn(`[PROFILE FETCH] No user found for ID: ${req.user.id}`);
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    console.log(`[PROFILE FETCH] Found data for: ${rows[0].name}`);
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(`[PROFILE FETCH ERROR]: ${err.message}`);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTeacherProfile = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { mobile, dob, qualification, experience, address } = req.body;
    const userId = req.user.id;

    // 1. Update User phone if mobile provided
    if (mobile) {
      await connection.execute('UPDATE users SET phone = ? WHERE id = ?', [mobile, userId]);
    }

    // 2. Update/Insert Teacher profile
    const [existing] = await connection.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
    if (existing.length > 0) {
      await connection.execute(`
        UPDATE teachers SET 
          mobile = COALESCE(?, mobile),
          dob = COALESCE(?, dob),
          qualification = COALESCE(?, qualification),
          experience = COALESCE(?, experience),
          address = COALESCE(?, address)
        WHERE user_id = ?
      `, [mobile || null, dob || null, qualification || null, experience || null, address || null, userId]);
    } else {
      await connection.execute(`
        INSERT INTO teachers (user_id, mobile, dob, qualification, experience, address)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, mobile || '', dob || null, qualification || '', experience || '', address || '']);
    }

    await connection.commit();
    return res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};
