// src/controllers/teacherLoController.js
const prisma   = require('../config/db')
const pool     = require('../config/mysqlDb')
const { sendSuccess, sendError } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const INCLUDE = {
  teacher: { select: { id: true, name: true } },
  class:   { select: { id: true, class_name: true, section: true } },
  subject: { select: { id: true, name: true } },
}

/**
 * GET /api/teacher-lo/assignments
 * Returns classes & subjects assigned to the logged-in teacher
 */
const getAssignedClasses = async (req, res) => {
  try {
    const userId = req.user.id;
    const sql = `
      SELECT 
        ac.id as class_id,
        ac.name as class_name,
        c.section,
        sub.id as subject_id,
        sub.name as subject_name
      FROM teacher_subjects ts
      JOIN academic_classes ac ON ts.class_id = ac.id
      JOIN classes c ON c.id = ts.class_id
      JOIN subjects sub ON ts.subject_id = sub.id
      WHERE ts.teacher_id = ?
    `;
    const [rows] = await pool.execute(sql, [userId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /api/teacher-lo/topics
 * Returns syllabus topics for a given class and subject
 */
const getSyllabusTopics = async (req, res) => {
  try {
    const { class_id, subject_id } = req.query;
    if (!class_id || !subject_id) return res.status(400).json({ success: false, message: 'Missing params' });
    
    const [rows] = await pool.execute(
      'SELECT topic FROM syllabus WHERE class_id = ? AND subject_id = ?',
      [class_id, subject_id]
    );
    res.json({ success: true, data: rows.map(r => r.topic) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
const getTeacherLO = async (req, res) => {
  const userId = req.user.id;
  const { class_id, subject_id, month } = req.query;

  try {
    const sql = `
      SELECT 
        tlo.id,
        tlo.class_id,
        COALESCE(c.section, 'A') as section,
        sub.name as subject,
        tlo.month,
        tlo.week,
        tlo.topic,
        tlo.teacher_score as teacherScore,
        tlo.principal_score as principalScore
      FROM teacher_performance_lo tlo
      JOIN subjects sub ON sub.id = tlo.subject_id
      JOIN teachers t ON t.id = tlo.teacher_id
      LEFT JOIN classes c ON c.id = tlo.class_id
      WHERE t.user_id = ?
      ${class_id ? 'AND tlo.class_id = ?' : ''}
      ${subject_id ? 'AND tlo.subject_id = ?' : ''}
      ${month ? 'AND tlo.month = ?' : ''}
      ORDER BY tlo.month DESC, tlo.week DESC
    `;

    const values = [userId];
    if (class_id) values.push(Number(class_id));
    if (subject_id) values.push(Number(subject_id));
    if (month) values.push(month);

    const [rows] = await pool.execute(sql, values);
    
    console.log("Query executed successfully");
    console.log("Teacher ID:", userId);
    console.log("Rows fetched:", rows.length);

    const formatted = rows.map(r => ({
      class: `Class ${r.class_id}`,
      section: r.section,
      subject: r.subject,
      topic: r.topic,
      month: r.month,
      week: r.week,
      teacherScore: r.teacherScore !== null ? parseFloat(Number(r.teacherScore).toFixed(1)) : null,
      principalScore: r.principalScore !== null ? parseFloat(Number(r.principalScore).toFixed(1)) : null
    }));

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error("Teacher LO API Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/teacher-lo/students/:classId
 * Returns students list for a class to enable LO assignment
 */
const getStudentsForLO = async (req, res) => {
  console.log("[DEBUG] getStudentsForLO triggered for classId:", req.params.classId);
  try {
    const { classId } = req.params
    // Loosen status filter to ensure students appear
    const students = await prisma.students.findMany({
      where: { 
        class_id: Number(classId)
      },
      select: {
        id: true,
        name: true,
        roll_no: true
      },
      orderBy: { roll_no: 'asc' }
    })

    console.log("ROWS:", students.length);
    return res.status(200).json({ success: true, data: students })
  } catch (err) {
    console.error("[STUDENTS LO ERROR]:", err);
    return res.status(500).json({ success: false, data: [], message: err.message })
  }
}

/** POST /api/teacher-lo/self */
const submitSelfAssessment = async (req, res) => {
  const { class_id, subject_id, month, week, topic, score, remarks } = req.body
  console.log("Saving LO:", req.body)

  const teacher = await prisma.teachers.findUnique({ where: { user_id: req.user.id } })
  if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' })
  const teacher_id = teacher.id

  // 1. Validation: Assigned class
  const isAssigned = await prisma.teacher_subjects.findFirst({
    where: { teacher_id: req.user.id, class_id: Number(class_id), subject_id: Number(subject_id) }
  })
  if (!isAssigned) return res.status(403).json({ success: false, message: 'You are not assigned to this class/subject' })

  // 2. Validation: Topic in syllabus
  const inSyllabus = await prisma.syllabus.findFirst({
    where: { class_id: Number(class_id), subject_id: Number(subject_id), topic }
  })
  if (!inSyllabus) return res.status(400).json({ success: false, message: 'Topic not found in syllabus for this class' })

  // 3. Validation: Score
  const s = Number(score)
  if (isNaN(s) || s < 0 || s > 100) return res.status(400).json({ success: false, message: 'Score must be between 0 and 100' })

  const existing = await prisma.teacher_performance_lo.findFirst({
    where: { 
      teacher_id, 
      class_id:   Number(class_id), 
      subject_id: Number(subject_id), 
      month, 
      week,
      topic
    }
  })

  const status = s >= 80 ? 'Exceeding' : s >= 60 ? 'Meeting' : 'Approaching'
  
  if (existing) {
    // UPDATE SAME RECORD - DO NOT OVERWRITE PRINCIPAL SCORE
    await prisma.teacher_performance_lo.update({ 
      where: { id: existing.id }, 
      data: {
        teacher_score: s,
        status,
        remarks: remarks || null
      } 
    })
  } else {
    // NEW RECORD
    await prisma.teacher_performance_lo.create({ 
      data: {
        teacher_id,
        class_id:   Number(class_id),
        subject_id: Number(subject_id),
        month,
        week,
        topic,
        teacher_score: s,
        status,
        remarks: remarks || null
      }
    })
  }

  return res.status(200).json({ success: true, message: 'Assessment saved successfully' })
}

/** POST /api/teacher-lo/award */
const awardAdminScore = async (req, res) => {
  const { teacher_id, class_id, subject_id, month, week, topic, score, status, remarks } = req.body

  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, data: [], message: 'Unauthorized' })
  }

  if (!teacher_id || !class_id || !subject_id || !month || !week || !topic || score === undefined) {
    return res.status(400).json({ success: false, data: [], message: 'Missing required fields' })
  }

  const existing = await prisma.teacher_performance_lo.findFirst({
    where: { 
      teacher_id: Number(teacher_id), 
      class_id:   Number(class_id), 
      subject_id: Number(subject_id), 
      month, 
      week,
      topic
    }
  })

  const s = Number(score)
  const computedStatus = status || (s >= 80 ? 'Exceeding' : s >= 60 ? 'Meeting' : 'Approaching')

  if (existing) {
    // UPDATE SAME RECORD - DO NOT OVERWRITE TEACHER SCORE
    await prisma.teacher_performance_lo.update({
      where: { id: existing.id },
      data: {
        principal_score: s,
        remarks: remarks || null
      }
    })
  } else {
    // NEW RECORD
    await prisma.teacher_performance_lo.create({
      data: {
        teacher_id: Number(teacher_id),
        class_id:   Number(class_id),
        subject_id: Number(subject_id),
        month,
        week,
        topic,
        principal_score: s,
        status: computedStatus,
        remarks: remarks || null
      }
    })
  }

  return res.status(200).json({ success: true, message: 'Admin score awarded successfully' })
}

/** GET /api/teacher-lo/summary */
const getSummary = async (req, res) => {
  try {
    const teacher = await prisma.teachers.findUnique({ where: { user_id: req.user.id } })
    const where = {}
    if (req.user.role === 'teacher' && teacher) where.teacher_id = teacher.id

    const [approaching, meeting, exceeding] = await prisma.$transaction([
      prisma.teacher_performance_lo.count({ where: { ...where, status: 'Approaching' } }),
      prisma.teacher_performance_lo.count({ where: { ...where, status: 'Meeting'     } }),
      prisma.teacher_performance_lo.count({ where: { ...where, status: 'Exceeding'   } }),
    ])

    return res.status(200).json({ success: true, data: { approaching, meeting, exceeding } })
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message })
  }
}

module.exports = { getTeacherLO, getStudentsForLO, submitSelfAssessment, awardAdminScore, getSummary, getAssignedClasses, getSyllabusTopics }
