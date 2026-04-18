// src/controllers/homeworkController.js
const prisma   = require('../config/db')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const HW_INCLUDE = {
  teacher: { select: { id: true, name: true } },
  class:   { select: { id: true, class_name: true, section: true } },
  subject: { select: { id: true, name: true } },
  _count:  { select: { submissions: true } },
}

/** GET /api/homework?class_id=&subject_id=&teacher_id= */
const getHomework = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { class_id, subject_id, teacher_id } = req.query

  const where = {}
  if (class_id)   where.class_id   = Number(class_id)
  if (subject_id) where.subject_id = Number(subject_id)

  // Teachers only see their own assignments
  if (req.user.role === 'teacher') where.teacher_id = req.user.id
  else if (teacher_id)            where.teacher_id  = Number(teacher_id)

  const [items, total] = await prisma.$transaction([
    prisma.homework.findMany({ where, skip, take, include: HW_INCLUDE, orderBy: { created_at: 'desc' } }),
    prisma.homework.count({ where }),
  ])

  // Enrich each with submission counts
  const enriched = await Promise.all(items.map(async hw => {
    const classSize = await prisma.students.count({ where: { class_id: hw.class_id } })
    const submitted = await prisma.homework_submissions.count({
      where: { homework_id: hw.id, status: 'submitted' },
    })
    return {
      ...hw,
      classSize,
      submitted,
      pending:         classSize - submitted,
      submissionPct:   classSize ? Math.round((submitted / classSize) * 100) : 0,
    }
  }))

  return sendSuccess(res, paginated(enriched, total, page, limit))
}

/** GET /api/homework/:id */
const getHomeworkById = async (req, res) => {
  const hw = await prisma.homework.findUnique({
    where:   { id: Number(req.params.id) },
    include: HW_INCLUDE,
  })
  if (!hw) return sendError(res, 'Homework not found.', 404)
  return sendSuccess(res, hw)
}

/** GET /api/homework/:id/submissions */
const getSubmissions = async (req, res) => {
  const hw = await prisma.homework.findUnique({ where: { id: Number(req.params.id) } })
  if (!hw) return sendError(res, 'Homework not found.', 404)

  const subs = await prisma.homework_submissions.findMany({
    where:   { homework_id: Number(req.params.id) },
    include: { student: { include: { class: { select: { class_name: true, section: true } } } } },
    orderBy: { submission_date: 'asc' },
  })

  // Get all students in this class to identify defaulters
  const allStudents = await prisma.students.findMany({ where: { class_id: hw.class_id } })
  const submittedIds = new Set(subs.map(s => s.student_id))
  const defaulters = allStudents.filter(s => !submittedIds.has(s.id))

  return sendSuccess(res, {
    homework:      hw,
    submissions:   subs,
    defaulters,
    submittedCount:subs.length,
    pendingCount:  defaulters.length,
    submissionPct: allStudents.length ? Math.round((subs.length / allStudents.length) * 100) : 0,
  })
}

/** POST /api/homework */
const createHomework = async (req, res) => {
  const { class_id, subject_id, description, assigned_date, due_date } = req.body
  const hw = await prisma.homework.create({
    data: {
      teacher_id:    req.user.id,
      class_id:      Number(class_id),
      subject_id:    Number(subject_id),
      description,
      assigned_date: assigned_date ? new Date(assigned_date) : new Date(),
      due_date:      due_date ? new Date(due_date) : null,
    },
    include: HW_INCLUDE,
  })
  return sendSuccess(res, hw, 'Homework created.', 201)
}

/** POST /api/homework/:id/submit */
const submitHomework = async (req, res) => {
  const homework_id = Number(req.params.id)
  const { student_id, score } = req.body

  const hw = await prisma.homework.findUnique({ where: { id: homework_id } })
  if (!hw) return sendError(res, 'Homework not found.', 404)

  // Determine if late
  const now      = new Date()
  const isLate   = hw.due_date && now > new Date(hw.due_date)
  const status   = isLate ? 'late' : 'submitted'

  const submission = await prisma.homework_submissions.upsert({
    where:  { homework_id_student_id: { homework_id, student_id: Number(student_id) } },
    update: { status, score, submission_date: now },
    create: { homework_id, student_id: Number(student_id), status, score, submission_date: now },
  })
  return sendSuccess(res, submission, isLate ? 'Submission recorded (late).' : 'Homework submitted.', 201)
}

/** PUT /api/homework/submission/:id */
const updateSubmission = async (req, res) => {
  const { status, score } = req.body
  const sub = await prisma.homework_submissions.update({
    where: { id: Number(req.params.id) },
    data:  { status, score },
  })
  return sendSuccess(res, sub, 'Submission updated.')
}

module.exports = { getHomework, getHomeworkById, getSubmissions, createHomework, submitHomework, updateSubmission }
