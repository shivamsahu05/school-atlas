// src/controllers/leaveController.js
const prisma   = require('../config/db')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const INCLUDE = {
  user: { select: { id: true, name: true, email: true, role: true } },
}

/** GET /api/leave?status=&user_id= */
const getLeaves = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { status, user_id } = req.query

  const where = {}
  // Teachers only see their own
  if (req.user.role === 'teacher') where.user_id = req.user.id
  else if (user_id)                where.user_id = Number(user_id)
  if (status) where.status = status

  const [items, total] = await prisma.$transaction([
    prisma.leave_requests.findMany({
      where, skip, take, include: INCLUDE,
      orderBy: { applied_date: 'desc' },
    }),
    prisma.leave_requests.count({ where }),
  ])

  // Summary counts
  const summary = await prisma.leave_requests.groupBy({
    by:    ['status'],
    where: req.user.role === 'teacher' ? { user_id: req.user.id } : {},
    _count:{ id: true },
  })
  const counts = summary.reduce((acc, s) => {
    acc[s.status] = s._count.id
    return acc
  }, { Pending: 0, Approved: 0, Rejected: 0 })

  return sendSuccess(res, { ...paginated(items, total, page, limit), summary: counts })
}

/** GET /api/leave/:id */
const getLeaveById = async (req, res) => {
  const leave = await prisma.leave_requests.findUnique({
    where:   { id: Number(req.params.id) },
    include: INCLUDE,
  })
  if (!leave) return sendError(res, 'Leave request not found.', 404)

  // Teachers can only view their own
  if (req.user.role === 'teacher' && leave.user_id !== req.user.id) {
    return sendError(res, 'Access denied.', 403)
  }
  return sendSuccess(res, leave)
}

/** POST /api/leave  (teacher applies) */
const createLeave = async (req, res) => {
  const { type, from_date, to_date, reason } = req.body

  const leave = await prisma.leave_requests.create({
    data: {
      user_id:   req.user.id,
      type,
      from_date: new Date(from_date),
      to_date:   new Date(to_date),
      reason,
      status:    'Pending',
    },
    include: INCLUDE,
  })
  return sendSuccess(res, leave, 'Leave application submitted.', 201)
}

/** PUT /api/leave/:id  (admin approves/rejects, teacher can cancel pending) */
const updateLeave = async (req, res) => {
  const id    = Number(req.params.id)
  const leave = await prisma.leave_requests.findUnique({ where: { id } })
  if (!leave) return sendError(res, 'Leave request not found.', 404)

  // Teachers can only cancel their own pending requests
  if (req.user.role === 'teacher') {
    if (leave.user_id !== req.user.id) return sendError(res, 'Access denied.', 403)
    if (leave.status  !== 'Pending')   return sendError(res, 'Only pending requests can be cancelled.', 400)
    const updated = await prisma.leave_requests.update({
      where: { id }, data: { status: 'Rejected' }, include: INCLUDE,
    })
    return sendSuccess(res, updated, 'Leave request cancelled.')
  }

  // Admin: approve or reject
  const { status } = req.body
  const updated = await prisma.leave_requests.update({
    where: { id }, data: { status }, include: INCLUDE,
  })
  return sendSuccess(res, updated, `Leave request ${status.toLowerCase()}.`)
}

module.exports = { getLeaves, getLeaveById, createLeave, updateLeave }
