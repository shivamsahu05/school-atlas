// src/controllers/observationsController.js
const prisma   = require('../config/db')
const { sendSuccess, sendError, paginated } = require('../utils/response')
const { parsePagination } = require('../utils/pagination')

const INCLUDE = {
  teacher:  { select: { id: true, name: true, email: true } },
  observer: { select: { id: true, name: true } },
}

/** GET /api/observations?teacher_id= */
const getObservations = async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query)
  const { teacher_id } = req.query

  const where = {}
  // Teachers only see their own observations
  if (req.user.role === 'teacher') where.teacher_id = req.user.id
  else if (teacher_id)             where.teacher_id = Number(teacher_id)

  const [items, total] = await prisma.$transaction([
    prisma.observations.findMany({ where, skip, take, include: INCLUDE, orderBy: { observation_date: 'desc' } }),
    prisma.observations.count({ where }),
  ])

  // Compute avg
  const aggr = await prisma.observations.aggregate({
    where,
    _avg: { total_score: true },
    _max: { total_score: true },
    _min: { total_score: true },
  })

  return sendSuccess(res, {
    ...paginated(items, total, page, limit),
    averageScore: aggr._avg.total_score ? Math.round(Number(aggr._avg.total_score)) : null,
    maxScore:     aggr._max.total_score,
    minScore:     aggr._min.total_score,
  })
}

/** POST /api/observations */
const createObservation = async (req, res) => {
  const { teacher_id, observation_date, total_score, max_score } = req.body

  const obs = await prisma.observations.create({
    data: {
      teacher_id:       Number(teacher_id),
      observed_by:      req.user.id,
      observation_date: observation_date ? new Date(observation_date) : new Date(),
      total_score:      Number(total_score),
      max_score:        max_score ? Number(max_score) : 50,
    },
    include: INCLUDE,
  })

  // Recalculate and upsert performance scores
  await recalcPerformance(Number(teacher_id))

  return sendSuccess(res, obs, 'Observation recorded.', 201)
}

// ─── Internal helper: recalculate and persist performance score ───────────────
async function recalcPerformance(teacher_id) {
  // Syllabus %
  const sylRows = await prisma.syllabus.findMany({
    where: {
      class: { teacher_subjects: { some: { teacher_id } } },
    },
  })
  const sylPct = sylRows.length
    ? Math.round((sylRows.filter(s => s.is_completed).length / sylRows.length) * 100)
    : 0

  // LO avg %
  const loRows = await prisma.learning_outcomes.findMany({
    where: { student: { class: { teacher_subjects: { some: { teacher_id } } } } },
  })
  const loPct = loRows.length
    ? Math.round(loRows.reduce((a, lo) => a + (Number(lo.teacher_score) / 10) * 100, 0) / loRows.length)
    : 0

  // Observation avg %
  const obsRows = await prisma.observations.findMany({ where: { teacher_id } })
  const obsPct  = obsRows.length
    ? Math.round(obsRows.reduce((a, o) => a + (o.total_score / o.max_score) * 100, 0) / obsRows.length)
    : 0

  // Weighted: 15% syllabus, 20% LO, 30% obs, 35% other (default 75)
  const otherScore = 75
  const overall = (sylPct * 0.15) + (loPct * 0.20) + (obsPct * 0.30) + (otherScore * 0.35)

  await prisma.performance_scores.upsert({
    where:  { teacher_id },
    create: { teacher_id, syllabus_completion_pct: sylPct, lo_avg_pct: loPct, observation_pct: obsPct, other_score: otherScore, overall_score: overall },
    update: { syllabus_completion_pct: sylPct, lo_avg_pct: loPct, observation_pct: obsPct, other_score: otherScore, overall_score: overall },
  })
}

module.exports = { getObservations, createObservation, recalcPerformance }
