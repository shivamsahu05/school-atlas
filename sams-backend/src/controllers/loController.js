// src/controllers/loController.js
const prisma   = require('../config/db')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const INCLUDE = {
  student: { include: { class: { select: { class_name: true, section: true } } } },
  subject: { select: { id: true, name: true } },
}

/** GET /api/lo?student_id=&subject_id=&class_id=&status= */
const getLO = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { student_id, subject_id, status, class_id } = req.query

  const where = {}
  if (student_id) where.student_id = Number(student_id)
  if (subject_id) where.subject_id = Number(subject_id)
  if (status)     where.status     = status

  // Filter by class via student relation
  if (class_id) {
    where.student = { class_id: Number(class_id) }
  }

  const [items, total] = await prisma.$transaction([
    prisma.learning_outcomes.findMany({ where, skip, take, include: INCLUDE, orderBy: { created_at: 'desc' } }),
    prisma.learning_outcomes.count({ where }),
  ])

  // Compute distribution
  const distribution = await prisma.learning_outcomes.groupBy({
    by:    ['status'],
    where: { subject_id: subject_id ? Number(subject_id) : undefined },
    _count:{ id: true },
  })

  return sendSuccess(res, {
    ...paginated(items, total, page, limit),
    distribution: distribution.reduce((acc, d) => {
      acc[d.status] = d._count.id
      return acc
    }, { Approaching: 0, Meeting: 0, Exceeding: 0 }),
  })
}

/** POST /api/lo */
const createLO = async (req, res) => {
  const { student_id, subject_id, topic, teacher_score, principal_score, status } = req.body

  // Auto-compute status from teacher_score if not provided
  let computedStatus = status
  if (!status && teacher_score !== undefined) {
    const s = Number(teacher_score)
    computedStatus = s >= 8 ? 'Exceeding' : s >= 6 ? 'Meeting' : 'Approaching'
  }

  const lo = await prisma.learning_outcomes.create({
    data: {
      student_id:      Number(student_id),
      subject_id:      Number(subject_id),
      topic,
      teacher_score:   teacher_score   != null ? Number(teacher_score)   : null,
      principal_score: principal_score != null ? Number(principal_score) : null,
      status:          computedStatus ?? 'Meeting',
    },
    include: INCLUDE,
  })
  return sendSuccess(res, lo, 'Learning outcome created.', 201)
}

/** PUT /api/lo/:id */
const updateLO = async (req, res) => {
  const { topic, teacher_score, principal_score, status } = req.body
  const data = {}
  if (topic            !== undefined) data.topic            = topic
  if (teacher_score    !== undefined) data.teacher_score    = Number(teacher_score)
  if (principal_score  !== undefined) data.principal_score  = Number(principal_score)

  // Recompute status if scores change
  if (status) {
    data.status = status
  } else if (teacher_score !== undefined) {
    const s = Number(teacher_score)
    data.status = s >= 8 ? 'Exceeding' : s >= 6 ? 'Meeting' : 'Approaching'
  }

  const lo = await prisma.learning_outcomes.update({
    where:   { id: Number(req.params.id) },
    data,
    include: INCLUDE,
  })
  return sendSuccess(res, lo, 'Learning outcome updated.')
}

module.exports = { getLO, createLO, updateLO }
