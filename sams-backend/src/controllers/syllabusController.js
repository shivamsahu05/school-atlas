// src/controllers/syllabusController.js
const prisma   = require('../config/db')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const INCLUDE = {
  class:   { select: { id: true, class_name: true, section: true } },
  subject: { select: { id: true, name: true } },
}

/** GET /api/syllabus?class_id=&subject_id=&is_completed= */
const getSyllabus = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { class_id, subject_id, is_completed, search } = req.query

  const where = {}
  if (class_id)    where.class_id   = Number(class_id)
  if (subject_id)  where.subject_id = Number(subject_id)
  if (is_completed !== undefined) where.is_completed = is_completed === 'true'
  if (search)      where.topic = { contains: search }

  const [items, total] = await prisma.$transaction([
    prisma.syllabus.findMany({
      where, skip, take, include: INCLUDE,
      orderBy: { planned_date: 'asc' },
    }),
    prisma.syllabus.count({ where }),
  ])

  // Append stats
  const stats = await prisma.syllabus.groupBy({
    by:    ['is_completed'],
    where: { class_id: class_id ? Number(class_id) : undefined, subject_id: subject_id ? Number(subject_id) : undefined },
    _count: { id: true },
  })
  const completed = stats.find(s => s.is_completed)?._count.id ?? 0
  const pending   = stats.find(s => !s.is_completed)?._count.id ?? 0
  const completionPct = total ? Math.round((completed / (completed + pending)) * 100) : 0

  return sendSuccess(res, {
    ...paginated(items, total, page, limit),
    stats: { total: completed + pending, completed, pending, completionPct },
  })
}

/** GET /api/syllabus/:id */
const getSyllabusById = async (req, res) => {
  const item = await prisma.syllabus.findUnique({
    where:   { id: Number(req.params.id) },
    include: INCLUDE,
  })
  if (!item) return sendError(res, 'Syllabus item not found.', 404)
  return sendSuccess(res, item)
}

/** POST /api/syllabus */
const createSyllabus = async (req, res) => {
  const { class_id, subject_id, chapter, topic, planned_date, completed_date, is_completed } = req.body
  const item = await prisma.syllabus.create({
    data: {
      class_id:   Number(class_id),
      subject_id: Number(subject_id),
      chapter, topic,
      planned_date:   planned_date   ? new Date(planned_date)   : null,
      completed_date: completed_date ? new Date(completed_date) : null,
      is_completed:   is_completed ?? false,
    },
    include: INCLUDE,
  })
  return sendSuccess(res, item, 'Syllabus item created.', 201)
}

/** PUT /api/syllabus/:id */
const updateSyllabus = async (req, res) => {
  const { chapter, topic, planned_date, completed_date, is_completed } = req.body
  const data = {}
  if (chapter       !== undefined) data.chapter       = chapter
  if (topic         !== undefined) data.topic         = topic
  if (planned_date  !== undefined) data.planned_date  = planned_date  ? new Date(planned_date)  : null
  if (is_completed  !== undefined) {
    data.is_completed   = is_completed
    // Auto-set completed_date when marking complete
    if (is_completed && !completed_date) data.completed_date = new Date()
    else if (completed_date !== undefined) data.completed_date = completed_date ? new Date(completed_date) : null
  }

  const item = await prisma.syllabus.update({
    where:   { id: Number(req.params.id) },
    data,
    include: INCLUDE,
  })
  return sendSuccess(res, item, 'Syllabus item updated.')
}

module.exports = { getSyllabus, getSyllabusById, createSyllabus, updateSyllabus }
