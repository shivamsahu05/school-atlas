// src/controllers/performanceController.js
const prisma   = require('../config/db')
const { sendSuccess, sendError } = require('../utils/response')
const { recalcPerformance }      = require('./observationsController')

/**
 * GET /api/performance/teacher/:id
 * Returns latest (or freshly calculated) performance scores for a teacher.
 */
const getTeacherPerformance = async (req, res) => {
  const teacher_id = Number(req.params.id)

  // Teachers can only view their own
  if (req.user.role === 'teacher' && req.user.id !== teacher_id) {
    return sendError(res, 'Access denied.', 403)
  }

  const teacher = await prisma.users.findUnique({
    where:  { id: teacher_id },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!teacher || teacher.role !== 'teacher') return sendError(res, 'Teacher not found.', 404)

  // Recalculate on-demand to keep fresh
  await recalcPerformance(teacher_id)

  const perf = await prisma.performance_scores.findUnique({
    where:   { teacher_id },
    include: { teacher: { select: { id: true, name: true, email: true } } },
  })

  // Weighted breakdown for frontend display
  const breakdown = perf ? {
    syllabus:    { score: Number(perf.syllabus_completion_pct), weight: 15 },
    lo:          { score: Number(perf.lo_avg_pct),              weight: 20 },
    observation: { score: Number(perf.observation_pct),         weight: 30 },
    other:       { score: Number(perf.other_score),             weight: 35 },
    overall:     Number(perf.overall_score),
  } : null

  return sendSuccess(res, { teacher, performance: perf, breakdown })
}

/**
 * GET /api/performance/all  (admin only)
 * Returns performance for all teachers sorted by overall score.
 */
const getAllPerformance = async (req, res) => {
  // Recalculate all teachers
  const teachers = await prisma.users.findMany({ where: { role: 'teacher', status: 'active' } })
  await Promise.all(teachers.map(t => recalcPerformance(t.id).catch(() => {})))

  const perfs = await prisma.performance_scores.findMany({
    include: { teacher: { select: { id: true, name: true, email: true } } },
    orderBy: { overall_score: 'desc' },
  })

  return sendSuccess(res, perfs)
}

module.exports = { getTeacherPerformance, getAllPerformance }
