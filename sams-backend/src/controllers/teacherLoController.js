// src/controllers/teacherLoController.js
const prisma   = require('../config/db')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const INCLUDE = {
  teacher: { select: { id: true, name: true } },
  class:   { select: { id: true, class_name: true, section: true } },
  subject: { select: { id: true, name: true } },
}

/** GET /api/teacher-lo */
const getTeacherLO = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { teacher_id, class_id, subject_id, month } = req.query

  const where = {}
  if (teacher_id) {
    where.teacher_id = Number(teacher_id)
  } else if (req.user.role === 'teacher') {
    where.teacher_id = req.user.id
  }

  if (class_id)   where.class_id   = Number(class_id)
  if (subject_id) where.subject_id = Number(subject_id)
  if (month)      where.month      = month

  const [items, total] = await prisma.$transaction([
    prisma.teacher_performance_lo.findMany({ 
      where, 
      skip, 
      take, 
      include: INCLUDE, 
      orderBy: { created_at: 'desc' } 
    }),
    prisma.teacher_performance_lo.count({ where }),
  ])

  return sendSuccess(res, paginated(items, total, page, limit))
}

/** POST /api/teacher-lo/self */
const submitSelfAssessment = async (req, res) => {
  const { class_id, subject_id, month, week, topic, score, status, remarks } = req.body
  const teacher_id = req.user.id

  if (!class_id || !subject_id || !month || !week || !topic || score === undefined) {
    return sendError(res, 'Missing required fields', 400)
  }

  // Find existing entry for this specific combination
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

  let computedStatus = status
  if (!status && score !== undefined) {
    const s = Number(score)
    computedStatus = s >= 80 ? 'Exceeding' : s >= 60 ? 'Meeting' : 'Approaching'
  }

  const data = {
    teacher_id,
    class_id:   Number(class_id),
    subject_id: Number(subject_id),
    month,
    week,
    topic,
    teacher_score: Number(score),
    status: computedStatus || 'Meeting',
    remarks: remarks || null,
  }

  let result
  if (existing) {
    result = await prisma.teacher_performance_lo.update({
      where: { id: existing.id },
      data,
      include: INCLUDE
    })
  } else {
    result = await prisma.teacher_performance_lo.create({
      data,
      include: INCLUDE
    })
  }

  return sendSuccess(res, result, 'Self assessment submitted.', existing ? 200 : 201)
}

/** POST /api/teacher-lo/award */
const awardAdminScore = async (req, res) => {
  const { teacher_id, class_id, subject_id, month, week, topic, score, status, remarks } = req.body

  if (req.user.role !== 'admin') {
    return sendError(res, 'Unauthorized', 403)
  }

  if (!teacher_id || !class_id || !subject_id || !month || !week || !topic || score === undefined) {
    return sendError(res, 'Missing required fields', 400)
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

  let computedStatus = status
  if (!status && score !== undefined) {
    const s = Number(score)
    computedStatus = s >= 80 ? 'Exceeding' : s >= 60 ? 'Meeting' : 'Approaching'
  }

  const data = {
    teacher_id: Number(teacher_id),
    class_id:   Number(class_id),
    subject_id: Number(subject_id),
    month,
    week,
    topic,
    principal_score: Number(score),
    status: computedStatus || (existing ? existing.status : 'Meeting'),
    remarks: remarks || (existing ? existing.remarks : null),
  }

  let result
  if (existing) {
    result = await prisma.teacher_performance_lo.update({
      where: { id: existing.id },
      data,
      include: INCLUDE
    })
  } else {
    result = await prisma.teacher_performance_lo.create({
      data,
      include: INCLUDE
    })
  }

  return sendSuccess(res, result, 'Admin score awarded.', existing ? 200 : 201)
}

module.exports = { getTeacherLO, submitSelfAssessment, awardAdminScore }
