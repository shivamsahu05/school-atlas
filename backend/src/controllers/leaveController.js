// src/controllers/leaveController.js
const prisma   = require('../config/db')
const pool     = require('../config/mysqlDb') // Raw SQL fallback only — do NOT use for new features
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')
const notificationEventService = require('../utils/notificationEventService')

const INCLUDE = {
  user: { 
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true,
      phone: true,
      teacher_profile: { select: { mobile: true } }
    } 
  },
}

/** GET /api/leave?status=&user_id=&month=Jan&year=2026 */
const getLeaves = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { status, user_id, month, year } = req.query

  const MONTH_MAP = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 }

  try {
    const where = {}
    if (req.user.role === 'teacher') where.user_id = req.user.id
    else if (user_id)                where.user_id = Number(user_id)
    if (status) where.status = status

    if (month || year) {
      const targetYear  = year  ? parseInt(year)        : null
      const targetMonth = month ? MONTH_MAP[month] ?? null : null
      where.applied_date = {
        ...(targetYear  ? { gte: new Date(targetYear, (targetMonth ?? 1) - 1, 1),
                            lt:  new Date(targetYear, (targetMonth ?? 12), 1) } : {}),
      }
      if (targetMonth && !targetYear) delete where.applied_date
    }

    const [items, total] = await Promise.all([
      prisma.leave_requests.findMany({
        where, skip, take, include: INCLUDE,
        orderBy: { applied_date: 'desc' },
      }),
      prisma.leave_requests.count({ where }),
    ])

    const targetMonthNum = month ? MONTH_MAP[month] ?? null : null
    const filteredItems = (month && !year)
      ? items.filter(l => l.applied_date && new Date(l.applied_date).getMonth() + 1 === targetMonthNum)
      : items

    const summary = await prisma.leave_requests.groupBy({
      by:    ['status'],
      where: req.user.role === 'teacher' ? { user_id: req.user.id } : {},
      _count:{ id: true },
    })
    const counts = summary.reduce((acc, s) => {
      acc[s.status] = s._count.id
      return acc
    }, { Pending: 0, Approved: 0, Rejected: 0 })

    return sendSuccess(res, { ...paginated(filteredItems, total, page, limit), summary: counts })

  } catch (err) {
    console.warn('[LEAVE] Prisma failed, falling back to pool:', err.message);
    // pool is imported at the top — no inline require() needed
    try {
        let sql = "SELECT l.*, u.name as user_name, u.email as user_email, u.role as user_role FROM leave_requests l JOIN users u ON l.user_id = u.id WHERE 1=1";
        const params = [];
        if (req.user.role === 'teacher') { sql += " AND l.user_id = ?"; params.push(req.user.id); }
        else if (user_id) { sql += " AND l.user_id = ?"; params.push(Number(user_id)); }
        if (status) { sql += " AND l.status = ?"; params.push(status); }
        sql += " ORDER BY l.applied_date DESC LIMIT ? OFFSET ?";
        params.push(take, skip);

        const [rows] = await pool.execute(sql, params);
        const normalized = rows.map(r => ({ ...r, user: { name: r.user_name, email: r.user_email, role: r.user_role } }));

        const [sRows] = await pool.execute("SELECT status, COUNT(*) as count FROM leave_requests WHERE 1=1" + (req.user.role === 'teacher' ? " AND user_id = ?" : "") + " GROUP BY status", req.user.role === 'teacher' ? [req.user.id] : []);
        const counts = sRows.reduce((acc, s) => { acc[s.status] = s.count; return acc; }, { Pending: 0, Approved: 0, Rejected: 0 });

        return sendSuccess(res, { ...paginated(normalized, normalized.length, page, limit), summary: counts });
    } catch (fErr) {
        return sendError(res, 'Failed to fetch leaves.', 500);
    }
  }
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
  try {
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
    });

    // Create notification using Event Engine
    await notificationEventService.emitNotification('leave_request_created', {
      leaveId: leave.id,
      userName: req.user.name,
      teacherUserId: req.user.id,
      type: type
    });

    return sendSuccess(res, leave, 'Leave application submitted.', 201)
  } catch (error) {
    console.error('[createLeave] Error:', error);
    return sendError(res, error.message);
  }
}

/** PUT /api/leave/:id  (admin approves/rejects, teacher can cancel pending) */
const updateLeave = async (req, res) => {
  const id = Number(req.params.id)
  const { status, admin_remarks } = req.body

  const leave = await prisma.leave_requests.findUnique({ where: { id } })
  if (!leave) return sendError(res, 'Leave request not found.', 404)

  // Security: Teachers can only cancel their own pending requests
  if (req.user.role === 'teacher') {
    if (leave.user_id !== req.user.id) return sendError(res, 'Access denied.', 403)
    if (leave.status  !== 'Pending')   return sendError(res, 'Only pending requests can be cancelled.', 400)
  }

  const updated = await prisma.leave_requests.update({
    where: { id },
    data: { 
      status: status || 'Rejected', 
      admin_remarks,
      updated_at: new Date()
    },
    include: INCLUDE
  })

  // Emit event if changed by admin
  if (req.user.role !== 'teacher') {
    if (updated.status === 'Approved') {
      await notificationEventService.emitNotification('leave_approved', { 
        leaveId: id, 
        teacherUserId: leave.user_id,
        remarks: admin_remarks
      })
    } else if (updated.status === 'Rejected') {
      await notificationEventService.emitNotification('leave_rejected', { 
        leaveId: id, 
        teacherUserId: leave.user_id,
        remarks: admin_remarks
      })
    }
  }

  return sendSuccess(res, updated, `Leave request updated to ${updated.status}.`)
}

module.exports = { getLeaves, getLeaveById, createLeave, updateLeave }
