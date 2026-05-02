require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const helmet   = require('helmet')
const morgan   = require('morgan')
const { errorHandler, notFound } = require('./middleware/errorHandler')

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes            = require('./routes/auth')
const usersRoutes           = require('./routes/users')
const teachersRoutes        = require('./routes/teachers')
const studentsRoutes        = require('./routes/students')
const classesRoutes         = require('./routes/classes')       // mounts /classes + /subjects
const syllabusRoutes        = require('./routes/syllabus')
const homeworkRoutes        = require('./routes/homework')
const loRoutes              = require('./routes/lo')
const teacherLoRoutes       = require('./routes/teacherLo')
const observationRoutes     = require('./routes/observations')
const performanceRoutes     = require('./routes/performance')
const leaveRoutes           = require('./routes/leave')
const dashboardRoutes       = require('./routes/dashboard')
const academicRoutes        = require('./routes/academic')      // /admin/*
const eventsRoutes          = require('./routes/events')
const contactRoutes         = require('./routes/contact')
const permissionRoutes      = require('./routes/permissionRoutes') // /admin/permissions/*
const adminLORoutes         = require('./routes/adminLORoutes')    // /admin/lo/*
const teacherScheduleRoutes = require('./routes/teacherScheduleRoutes')
const lmsIntelligenceRoutes = require('./routes/lmsIntelligenceRoutes')
const reportsRoutes         = require('./routes/reports')

let initCronJobs
try { initCronJobs = require('./utils/cronJobs') } catch { initCronJobs = () => {} }

const app  = express()
const PORT = process.env.PORT || 5000

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }))

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',').map(o => o.trim()).filter(Boolean)

app.use(cors({
  origin:               (origin, cb) => cb(null, true),
  credentials:          true,
  optionsSuccessStatus: 200,
  methods:              ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders:       ['Content-Type','Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status:'ok', env: process.env.NODE_ENV, ts: new Date() }))

// ── API Routes ────────────────────────────────────────────────────────────────
const A = '/api'

app.use(`${A}/auth`,              authRoutes)
app.use(`${A}/users`,             usersRoutes)
app.use(`${A}/teachers`,          teachersRoutes)
app.use(`${A}/students`,          studentsRoutes)
app.use(`${A}`,                   classesRoutes)          // /api/classes, /api/subjects
app.use(`${A}/syllabus`,          syllabusRoutes)
app.use(`${A}/homework`,          homeworkRoutes)
app.use(`${A}/lo`,                loRoutes)
app.use(`${A}/teacher-lo`,        teacherLoRoutes)
app.use(`${A}/observations`,      observationRoutes)
app.use(`${A}/performance`,       performanceRoutes)
app.use(`${A}/leave`,             leaveRoutes)
app.use(`${A}/dashboard`,         dashboardRoutes)
app.use(`${A}/events`,            eventsRoutes)
app.use(`${A}/contact`,           contactRoutes)
app.use(`${A}/teacher`,           teacherScheduleRoutes)
app.use(`${A}/admin`,             academicRoutes)          // /api/admin/classes,subjects…
app.use(`${A}/admin/permissions`, permissionRoutes)
app.use(`${A}/admin/lo`,          adminLORoutes)
app.use(`${A}/admin`,             reportsRoutes)
app.use(`${A}/lms/intelligence`,  lmsIntelligenceRoutes)

// ── Error handlers ────────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 SAMS Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
  try { initCronJobs() } catch {}
})

module.exports = app
