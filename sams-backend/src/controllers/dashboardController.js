// src/controllers/dashboardController.js
const prisma            = require('../config/db')
const { sendSuccess }   = require('../utils/response')
const { recalcPerformance } = require('./observationsController')

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/teacher
// Returns all data required by the Teacher Dashboard page.
// ─────────────────────────────────────────────────────────────────────────────
const teacherDashboard = async (req, res) => {
  const teacher_id = req.user.id

  // 1. Classes & subjects this teacher handles
  const assignments = await prisma.teacher_subjects.findMany({
    where:   { teacher_id },
    include: {
      class:   { select: { id: true, class_name: true, section: true } },
      subject: { select: { id: true, name: true } },
    },
  })

  const classIds   = [...new Set(assignments.map(a => a.class_id))]
  const subjectIds = [...new Set(assignments.map(a => a.subject_id))]

  // 2. Syllabus completion
  const sylRows = await prisma.syllabus.findMany({
    where: { class_id: { in: classIds }, subject_id: { in: subjectIds } },
  })
  const syllabusTotal     = sylRows.length
  const syllabusCompleted = sylRows.filter(s => s.is_completed).length
  const syllabusCompPct   = syllabusTotal
    ? Math.round((syllabusCompleted / syllabusTotal) * 100) : 0

  // 3. Homework stats (this teacher's assignments)
  const hwRows = await prisma.homework.findMany({
    where:   { teacher_id },
    include: { _count: { select: { submissions: true } } },
  })

  let totalSubmissions = 0
  let totalStudentsForHw = 0
  for (const hw of hwRows) {
    const classSize = await prisma.students.count({ where: { class_id: hw.class_id } })
    totalStudentsForHw += classSize
    totalSubmissions   += hw._count.submissions
  }
  const homeworkSubmissionPct = totalStudentsForHw
    ? Math.round((totalSubmissions / totalStudentsForHw) * 100) : 0

  // 4. LO distribution across teacher's classes
  const loRows = await prisma.learning_outcomes.findMany({
    where: {
      subject_id: { in: subjectIds },
      student:    { class_id: { in: classIds } },
    },
  })
  const loDistribution = loRows.reduce(
    (acc, lo) => { acc[lo.status] = (acc[lo.status] || 0) + 1; return acc },
    { Approaching: 0, Meeting: 0, Exceeding: 0 }
  )
  const loAvgScore = loRows.length
    ? (loRows.reduce((a, lo) => a + Number(lo.teacher_score || 0), 0) / loRows.length).toFixed(2)
    : 0

  // 5. Classroom observations
  const obsRows = await prisma.observations.findMany({
    where:   { teacher_id },
    orderBy: { observation_date: 'desc' },
    take:    10,
  })
  const latestObs  = obsRows[0] ?? null
  const avgObsScore = obsRows.length
    ? Math.round(obsRows.reduce((a, o) => a + (o.total_score / o.max_score) * 100, 0) / obsRows.length)
    : 0

  // 6. Leave summary
  const leaveSummary = await prisma.leave_requests.groupBy({
    by:    ['status'],
    where: { user_id: teacher_id },
    _count:{ id: true },
  })
  const leaveCount = leaveSummary.reduce((acc, l) => {
    acc[l.status] = l._count.id; return acc
  }, { Pending: 0, Approved: 0, Rejected: 0 })

  // 7. Recent homework (last 5)
  const recentHomework = await prisma.homework.findMany({
    where:   { teacher_id },
    orderBy: { created_at: 'desc' },
    take:    5,
    include: {
      class:   { select: { class_name: true, section: true } },
      subject: { select: { name: true } },
    },
  })

  // 8. Weekly schedule (teacher's subjects, grouped by day — static structure)
  const schedule = buildStaticSchedule(assignments)

  // 9. Recalc and fetch performance score
  await recalcPerformance(teacher_id).catch(() => {})
  const performance = await prisma.performance_scores.findUnique({ where: { teacher_id } })

  return sendSuccess(res, {
    teacher: req.user,
    assignments,

    syllabus: {
      total:     syllabusTotal,
      completed: syllabusCompleted,
      pending:   syllabusTotal - syllabusCompleted,
      completionPct: syllabusCompPct,
    },

    homework: {
      total:              hwRows.length,
      totalSubmissions,
      totalStudents:      totalStudentsForHw,
      submissionPct:      homeworkSubmissionPct,
      recent:             recentHomework,
    },

    learningOutcomes: {
      total:        loRows.length,
      distribution: loDistribution,
      avgScore:     loAvgScore,
    },

    observations: {
      total:     obsRows.length,
      latest:    latestObs
        ? { score: latestObs.total_score, max: latestObs.max_score, pct: Math.round((latestObs.total_score / latestObs.max_score) * 100), date: latestObs.observation_date }
        : null,
      averagePct: avgObsScore,
    },

    leave: leaveCount,
    schedule,

    performance: performance
      ? {
          syllabus:    Number(performance.syllabus_completion_pct),
          lo:          Number(performance.lo_avg_pct),
          observation: Number(performance.observation_pct),
          other:       Number(performance.other_score),
          overall:     Number(performance.overall_score),
        }
      : null,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dashboard/admin
// Returns all data required by the Admin Dashboard page.
// ─────────────────────────────────────────────────────────────────────────────
const adminDashboard = async (req, res) => {

  // 1. Core counts
  const [totalTeachers, totalStudents, totalClasses] = await prisma.$transaction([
    prisma.users.count({ where: { role: 'teacher', status: 'active' } }),
    prisma.students.count(),
    prisma.classes.count(),
  ])

  // 2. School-wide syllabus completion
  const sylStats = await prisma.syllabus.groupBy({
    by:    ['is_completed'],
    _count:{ id: true },
  })
  const sylCompleted = sylStats.find(s => s.is_completed)?._count.id   ?? 0
  const sylPending   = sylStats.find(s => !s.is_completed)?._count.id  ?? 0
  const sylTotal     = sylCompleted + sylPending
  const syllabusCompPct = sylTotal ? Math.round((sylCompleted / sylTotal) * 100) : 0

  // 3. Pending leaves
  const pendingLeaves = await prisma.leave_requests.findMany({
    where:   { status: 'Pending' },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { applied_date: 'desc' },
    take:    10,
  })

  // 4. School-wide LO distribution
  const loGroups = await prisma.learning_outcomes.groupBy({
    by:    ['status'],
    _count:{ id: true },
  })
  const loDistribution = loGroups.reduce((acc, g) => {
    acc[g.status] = g._count.id; return acc
  }, { Approaching: 0, Meeting: 0, Exceeding: 0 })

  // 5. All teacher performance (recalc + fetch)
  const allTeachers = await prisma.users.findMany({ where: { role: 'teacher', status: 'active' } })
  await Promise.allSettled(allTeachers.map(t => recalcPerformance(t.id)))

  const allPerformance = await prisma.performance_scores.findMany({
    include: { teacher: { select: { id: true, name: true, email: true } } },
    orderBy: { overall_score: 'desc' },
  })

  // 6. Top 5 performers
  const topPerformers = allPerformance.slice(0, 5).map(p => ({
    teacher:  p.teacher,
    overall:  Number(p.overall_score),
    syllabus: Number(p.syllabus_completion_pct),
    lo:       Number(p.lo_avg_pct),
    obs:      Number(p.observation_pct),
  }))

  // 7. Observation stats
  const obsStats = await prisma.observations.aggregate({
    _avg: { total_score: true },
    _count:{ id: true },
  })
  const recentObs = await prisma.observations.findMany({
    orderBy: { observation_date: 'desc' },
    take:    5,
    include: {
      teacher:  { select: { id: true, name: true } },
      observer: { select: { id: true, name: true } },
    },
  })

  // 8. Homework compliance school-wide
  const [totalHw, totalSubs] = await prisma.$transaction([
    prisma.homework.count(),
    prisma.homework_submissions.count({ where: { status: 'submitted' } }),
  ])

  // 9. Class-wise student counts
  const classCounts = await prisma.classes.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: [{ class_name: 'asc' }, { section: 'asc' }],
  })

  // 10. School-wide syllabus per teacher (for chart)
  const teacherSyllabusChart = await Promise.all(
    allTeachers.map(async t => {
      const assign = await prisma.teacher_subjects.findMany({ where: { teacher_id: t.id } })
      const cids   = assign.map(a => a.class_id)
      const sids   = assign.map(a => a.subject_id)
      const rows   = await prisma.syllabus.findMany({ where: { class_id: { in: cids }, subject_id: { in: sids } } })
      const done   = rows.filter(r => r.is_completed).length
      return {
        teacher: t.name,
        total:   rows.length,
        done,
        pct:     rows.length ? Math.round((done / rows.length) * 100) : 0,
      }
    })
  )

  return sendSuccess(res, {
    overview: {
      totalTeachers,
      totalStudents,
      totalClasses,
      syllabusCompletionPct: syllabusCompPct,
      syllabusCompleted:     sylCompleted,
      syllabusTotal:         sylTotal,
    },

    homework: {
      total:         totalHw,
      totalSubmitted:totalSubs,
    },

    learningOutcomes: {
      total:        loGroups.reduce((a, g) => a + g._count.id, 0),
      distribution: loDistribution,
    },

    pendingLeaves: {
      count: pendingLeaves.length,
      items: pendingLeaves,
    },

    observations: {
      total:    obsStats._count.id,
      avgScore: obsStats._avg.total_score ? Math.round(Number(obsStats._avg.total_score)) : null,
      recent:   recentObs,
    },

    performance: {
      all:          allPerformance,
      topPerformers,
    },

    classes:             classCounts,
    teacherSyllabusChart,
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildStaticSchedule(assignments) {
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']
  const TIMES = ['8:00–8:45','8:45–9:30','9:45–10:30','10:30–11:15','11:30–12:15','12:15–1:00']

  return DAYS.map((day, di) => ({
    day,
    periods: TIMES.map((time, pi) => {
      const assign = assignments[pi % assignments.length]
      return {
        no:      pi + 1,
        time,
        subject: assign?.subject?.name ?? 'Free Period',
        class:   assign ? `${assign.class.class_name}-${assign.class.section}` : '–',
        status:  di < 2 || (di === 2 && pi < 3) ? 'Completed' : 'Pending',
      }
    }),
  }))
}

module.exports = { teacherDashboard, adminDashboard }
