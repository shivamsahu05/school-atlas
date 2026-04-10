// src/app.js
require('dotenv').config()
const express  = require('express')
const cors     = require('cors')
const helmet   = require('helmet')
const morgan   = require('morgan')

const { errorHandler, notFound } = require('./middleware/errorHandler')

// ─── Route modules ────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth')
const usersRoutes       = require('./routes/users')
const studentsRoutes    = require('./routes/students')
const classesRoutes     = require('./routes/classes')
const syllabusRoutes    = require('./routes/syllabus')
const homeworkRoutes    = require('./routes/homework')
const loRoutes          = require('./routes/lo')
const observationRoutes = require('./routes/observations')
const performanceRoutes = require('./routes/performance')
const leaveRoutes       = require('./routes/leave')
const dashboardRoutes   = require('./routes/dashboard')

const app  = express()
const PORT = process.env.PORT || 5000

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status:    'ok',
  service:   'SAMS API',
  version:   '1.0.0',
  timestamp: new Date().toISOString(),
  env:       process.env.NODE_ENV,
}))

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api'

app.use(`${API}/auth`,        authRoutes)
app.use(`${API}/users`,       usersRoutes)
app.use(`${API}/students`,    studentsRoutes)
app.use(`${API}`,             classesRoutes)   // mounts /api/classes + /api/subjects
app.use(`${API}/syllabus`,    syllabusRoutes)
app.use(`${API}/homework`,    homeworkRoutes)
app.use(`${API}/lo`,          loRoutes)
app.use(`${API}/observations`,observationRoutes)
app.use(`${API}/performance`, performanceRoutes)
app.use(`${API}/leave`,       leaveRoutes)
app.use(`${API}/dashboard`,   dashboardRoutes)

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────

// app.listen(PORT, () => {
//   console.log(`
//   ╔══════════════════════════════════════════╗
//   ║   SAMS API Server                        ║
//   ║   http://localhost:${PORT}                  ║
//   ║   ENV: ${(process.env.NODE_ENV || 'development').padEnd(34)}║
//   ╚══════════════════════════════════════════╝
//   `)
// })

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║   SAMS API Server                        ║
    ║   http://localhost:${PORT}               ║
    ║   ENV: ${(process.env.NODE_ENV || 'development').padEnd(34)}║
    ╚══════════════════════════════════════════╝
    `)
  })
}

module.exports = app

// module.exports = app
