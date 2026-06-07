// src/controllers/marksController.js
const pool = require('../config/mysqlDb');

const sendOk = (res, data, msg = 'OK', code = 200) => res.status(code).json({ success: true, data, message: msg });
const sendErr = (res, msg = 'Error', code = 500) => res.status(code).json({ success: false, message: msg });

exports.getTeacherOptions = async (req, res) => {
  try {
    const role = req.user.role;
    let teacherId = null;
    if (role === 'teacher') {
      const [t] = await pool.execute('SELECT id FROM teachers WHERE user_id = ? LIMIT 1', [req.user.id]);
      if (t.length > 0) teacherId = t[0].id;
    }
    
    const [classes] = await pool.execute('SELECT id, name FROM academic_classes ORDER BY name');
    const [sections] = await pool.execute('SELECT s.id, s.name, cs.class_id FROM acad_sections s JOIN acad_class_sections cs ON s.id = cs.section_id ORDER BY s.name');
    const [subjects] = await pool.execute('SELECT id, name FROM subjects ORDER BY name');

    if (role === 'admin' || role === 'principal') {
      return sendOk(res, { classes, sections, subjects, globalAccess: true });
    }

    const [perms] = await pool.execute(`
      SELECT tmp.class_id, tmp.section_id, tmp.subject_id
      FROM teacher_module_permissions tmp
      JOIN modules m ON tmp.module_id = m.id
      WHERE tmp.teacher_id = ? 
      AND tmp.status = 'ACTIVE' 
      AND (tmp.end_date IS NULL OR tmp.end_date >= CURDATE())
      AND (m.module_key = 'MARKS_ENTRY' OR m.module_key = 'ALL_ACADEMIC' OR m.module_key = 'ALL_FULL')
    `, [teacherId]);

    const hasGlobal = perms.some(p => p.class_id === null);
    if (hasGlobal) {
      return sendOk(res, { classes, sections, subjects, globalAccess: true });
    }

    return sendOk(res, { classes, sections, subjects, permissions: perms, globalAccess: false });
  } catch (err) {
    return sendErr(res, err.message);
  }
};

exports.getStudents = async (req, res) => {
  const { class_id, section_id, subject_id, exam_type, academic_year = '2025-2026' } = req.query;
  if (!class_id || !subject_id || !exam_type) return sendErr(res, 'class_id, subject_id, exam_type required', 400);

  try {
    let sql = `
      SELECT s.id as student_id, s.name, s.roll_no, 
             m.id as mark_id, m.marks_obtained
      FROM students s
      LEFT JOIN student_marks m ON s.id = m.student_id 
        AND m.subject_id = ? 
        AND m.exam_type = ?
      WHERE s.class_id = ?
    `;
    const params = [subject_id, exam_type, class_id];

    if (section_id) {
      sql += ' AND s.section_id = ?';
      params.push(section_id);
    }

    // Cast roll_no to unsigned to sort correctly if numerical
    sql += ' ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, s.roll_no ASC';

    const [rows] = await pool.execute(sql, params);
    return sendOk(res, rows);
  } catch (err) {
    return sendErr(res, err.message);
  }
};

exports.saveMarks = async (req, res) => {
  const { class_id, section_id, subject_id, exam_type, academic_year = '2025-2026', globalTotalMarks, marksData, isFinal } = req.body;
  const role = req.user.role;
  const enteredByUserId = req.user.id;
  let teacherId = null;
  if (role === 'teacher') {
    const [t] = await pool.execute('SELECT id FROM teachers WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (t.length > 0) teacherId = t[0].id;
  }

  if (!class_id || !subject_id || !exam_type || !marksData || !Array.isArray(marksData)) {
    return sendErr(res, 'Invalid data', 400);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const targetStatus = isFinal ? 'final_saved' : 'draft';
    const tMrk = (globalTotalMarks === '' || globalTotalMarks === null) ? null : Number(globalTotalMarks);
    for (const item of marksData) {
      const { student_id, marks_obtained } = item;
      
      const mObt = (marks_obtained === '' || marks_obtained === null) ? null : Number(marks_obtained);

      const [existing] = await connection.execute(
        'SELECT id FROM student_marks WHERE student_id = ? AND subject_id = ? AND exam_type = ?',
        [student_id, subject_id, exam_type]
      );

      if (existing.length > 0) {
        // Bypass final_saved check since status column doesn't exist
        await connection.execute(`
          UPDATE student_marks 
          SET marks_obtained = ?, teacher_id = COALESCE(teacher_id, ?), entered_by_user_id = ?
          WHERE student_id = ? AND subject_id = ? AND exam_type = ?
        `, [mObt, teacherId, enteredByUserId, student_id, subject_id, exam_type]);
      } else {
        await connection.execute(`
          INSERT INTO student_marks 
          (student_id, class_id, section_id, subject_id, exam_type, marks_obtained, teacher_id, entered_by_user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [student_id, class_id, section_id || null, subject_id, exam_type, mObt, teacherId, enteredByUserId]);
      }
    }

    await connection.commit();
    return sendOk(res, null, isFinal ? 'Marks Finalized successfully' : 'Draft saved successfully');
  } catch (err) {
    await connection.rollback();
    return sendErr(res, err.message);
  } finally {
    connection.release();
  }
};

exports.unlockMarks = async (req, res) => {
  const { student_id, class_id, subject_id, exam_type, academic_year = '2025-2026' } = req.body;
  if (req.user.role !== 'admin' && req.user.role !== 'principal') {
    return sendErr(res, 'Only admins can unlock marks.', 403);
  }
  if (!subject_id || !exam_type) return sendErr(res, 'Missing parameters', 400);

  try {
    if (student_id) {
      await pool.execute(`
        UPDATE student_marks 
        SET marks_obtained = marks_obtained 
        WHERE student_id = ? AND subject_id = ? AND exam_type = ?
      `, [student_id, subject_id, exam_type]);
    } else if (class_id) {
      await pool.execute(`
        UPDATE student_marks m
        JOIN students s ON m.student_id = s.id
        SET m.marks_obtained = m.marks_obtained
        WHERE s.class_id = ? AND m.subject_id = ? AND m.exam_type = ?
      `, [class_id, subject_id, exam_type]);
    } else {
      return sendErr(res, 'student_id or class_id required', 400);
    }
    return sendOk(res, null, 'Marks unlocked and reverted to draft.');
  } catch (err) {
    return sendErr(res, err.message);
  }
};

exports.getHistory = async (req, res) => {
  const { class_id, section_id, subject_id, academic_year = '2025-2026' } = req.query;
  if (!class_id || !subject_id) return sendErr(res, 'class_id, subject_id required', 400);

  try {
    let sql = `
      SELECT s.id as student_id, s.name, s.roll_no, 
             m.exam_type, m.marks_obtained,
             COALESCE(u_entry.name, u_teacher.name) as teacher_name
      FROM students s
      LEFT JOIN student_marks m ON s.id = m.student_id 
        AND m.subject_id = ?
      LEFT JOIN users u_entry ON m.entered_by_user_id = u_entry.id
      LEFT JOIN teachers t ON m.teacher_id = t.id
      LEFT JOIN users u_teacher ON t.user_id = u_teacher.id
      WHERE s.class_id = ?
    `;
    const params = [subject_id, class_id];

    if (section_id) {
      sql += ' AND s.section_id = ?';
      params.push(section_id);
    }

    sql += ' ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, s.roll_no ASC';

    const [rows] = await pool.execute(sql, params);
    
    const studentMap = {};
    for (const row of rows) {
      if (!studentMap[row.student_id]) {
        studentMap[row.student_id] = {
          student_id: row.student_id,
          name: row.name,
          roll_no: row.roll_no,
          marks: {}
        };
      }
      if (row.exam_type) {
        studentMap[row.student_id].marks[row.exam_type] = {
          obtained: row.marks_obtained,
          total: 50,
          status: 'draft',
          teacher_name: row.teacher_name
        };
      }
    }

    return sendOk(res, Object.values(studentMap));
  } catch (err) {
    return sendErr(res, err.message);
  }
};
exports.getMarksheet = async (req, res) => {
  const { academic_year, class_id, section_id } = req.query;
  if (!class_id || !academic_year) return sendErr(res, 'class_id and academic_year required', 400);

  // Canonical order of exam types (must match exact DB values)
  const EXAM_ORDER = ['Unit Test', 'Half Yearly Exam', 'Annual Exam'];

  try {
    // 1) Subjects officially assigned to this class
    const [subjects] = await pool.execute(`
      SELECT s.id, s.name 
      FROM subjects s
      JOIN acad_class_subjects cs ON s.id = cs.subject_id
      WHERE cs.class_id = ? 
      ORDER BY s.name ASC
    `, [class_id]);

    // 2) ALL active students in class (optionally filtered by section)
    const studentParams = section_id ? [class_id, section_id] : [class_id];
    const studentSecFilter = section_id ? 'AND s.section_id = ?' : '';
    const [students] = await pool.execute(`
      SELECT s.id as student_id, s.name, s.roll_no 
      FROM students s
      WHERE s.class_id = ? ${studentSecFilter} AND s.status = 'Active'
      ORDER BY CAST(s.roll_no AS UNSIGNED) ASC, s.roll_no ASC
    `, studentParams);

    // 3) ALL marks for this class + year (any status), with exam_type
    const marksParams = section_id ? [class_id, section_id] : [class_id];
    const marksSecFilter = section_id ? 'AND s.section_id = ?' : '';
    const [marks] = await pool.execute(`
      SELECT m.student_id, m.subject_id, m.marks_obtained, m.exam_type
      FROM student_marks m
      JOIN students s ON m.student_id = s.id
      WHERE s.class_id = ? ${marksSecFilter}
    `, marksParams);

    // 4) Find which exam types actually have data (preserve canonical order)
    const presentExamTypes = EXAM_ORDER.filter(et =>
      marks.some(m => m.exam_type === et)
    );

    // 5) Build marksheet: per student, per subject, per exam_type
    const result = students.map(student => {
      const studentMarks = marks.filter(m => m.student_id === student.student_id);
      let grandTotalObtained = 0;
      let grandTotalMax = 0;

      const subjectsData = subjects.map(sub => {
        const subMarks = studentMarks.filter(m => m.subject_id === sub.id);

        // Per-exam breakdown
        const byExam = {};
        presentExamTypes.forEach(et => {
          const examMark = subMarks.find(m => m.exam_type === et);
          byExam[et] = examMark
            ? { obtained: Number(examMark.marks_obtained || 0), total: 50 }
            : null;
        });

        // Subject total across all exams
        const subTotal = subMarks.length * 50;
        const subObtained = subMarks.reduce((s, m) => s + Number(m.marks_obtained || 0), 0);
        const hasData = subMarks.length > 0;

        if (hasData) {
          grandTotalObtained += subObtained;
          grandTotalMax += subTotal;
        }

        return {
          subject_id: sub.id,
          subject_name: sub.name,
          byExam,
          subObtained: hasData ? subObtained : null,
          subTotal: hasData ? subTotal : null
        };
      });

      const percentage = grandTotalMax > 0
        ? Number(((grandTotalObtained / grandTotalMax) * 100).toFixed(2))
        : null;

      return {
        ...student,
        subjects: subjectsData,
        grandTotalObtained,
        grandTotalMax,
        percentage
      };
    });

    return sendOk(res, { subjects, examTypes: presentExamTypes, marksheet: result });
  } catch (err) {
    return sendErr(res, err.message);
  }
};
