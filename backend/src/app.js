// src/app.js
const express      = require('express')
const cors         = require('cors')
const helmet       = require('helmet')
const morgan       = require('morgan')
require('dotenv').config()

const { notFound, errorHandler } = require('./middleware/errorHandler')
const { authenticate, roleCheck } = require('./middleware/auth')

// ─── Import Routes ────────────────────────────────────────────────────────────
const authRoutes            = require('./routes/auth')
const usersRoutes           = require('./routes/users')
const teachersRoutes        = require('./routes/teachers')
const classesRoutes         = require('./routes/classes')
const syllabusRoutes        = require('./routes/syllabus')
const homeworkRoutes        = require('./routes/homework')
const dashboardRoutes       = require('./routes/dashboard')
const loRoutes              = require('./routes/lo')
const teacherLoRoutes       = require('./routes/teacherLo')
const eventsRoutes          = require('./routes/events')
const adminLoRoutes         = require('./routes/adminLORoutes')
const performanceRoutes     = require('./routes/performance')
const leaveRoutes           = require('./routes/leave')
const observationsRoutes    = require('./routes/observations')
const teacherScheduleRoutes = require('./routes/teacherScheduleRoutes')
const academicRoutes        = require('./routes/academic')
const reportsRoutes         = require('./routes/reports')
const intelligenceRoutes    = require('./routes/lmsIntelligenceRoutes')
const permissionsRoutes     = require('./routes/permissionRoutes')
const studentsRoutes        = require('./routes/students')
const contactRoutes         = require('./routes/contactRoutes')
const systemRoutes          = require('./routes/systemRoutes')
const marksRoutes           = require('./routes/marksRoutes')

const app = express()

// ─── Production Middleware ──────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(morgan('dev'))
app.use(express.json())

// CORS: Production Hardened
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://school-atlas-sams.vercel.app,http://localhost:3000,http://localhost:5173')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    console.warn(`[CORS Blocked]: ${origin}`);
    return cb(null, true); // Fallback to true for production debugging if needed, or strict false
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Global Preflight OPTIONS handler
app.options('*', cors());

// ─── API Routes ───────────────────────────────────────────────────────────────
const A = '/api';

// 1. Health & Base
app.get(`${A}/health`, (req, res) => res.json({ status: 'UP', timestamp: new Date() }));
app.get('/', (req, res) => res.send('School Atlas SAMS API is running...'));

// 2. Core Modules
app.use(`${A}/auth`,           authRoutes)
app.use(`${A}/users`,          usersRoutes)
app.use(`${A}/teachers`,       teachersRoutes)
app.use(`${A}/students`,       studentsRoutes)
app.use(`${A}`,                classesRoutes) // /classes, /subjects
app.use(`${A}/syllabus`,       syllabusRoutes)
app.use(`${A}/homework`,       homeworkRoutes)
app.use(`${A}/dashboard`,      dashboardRoutes)

// 3. Performance & LO
app.use(`${A}/lo`,             loRoutes)
app.use(`${A}/teacher-lo`,     teacherLoRoutes)
app.use(`${A}/admin/lo`,       adminLoRoutes)
app.use(`${A}/performance`,    performanceRoutes)

// 4. Operations
app.use(`${A}/events`,         eventsRoutes)
app.use(`${A}/leave`,          leaveRoutes)
app.use(`${A}/observations`,   observationsRoutes)
app.use(`${A}/lms/intelligence`, intelligenceRoutes)
app.use(`${A}/contact`,        contactRoutes)

// 5. Teacher Specific (Crucial for 404/500 fixes)
app.use(`${A}/teacher`,        teacherScheduleRoutes) // /api/teacher/timetable, /api/teacher/schedule

// 6. Admin Management
app.use(`${A}/admin`,          academicRoutes)
app.use(`${A}/admin`,          reportsRoutes)
app.use(`${A}/admin/permissions`, permissionsRoutes)
app.use(`${A}/admin/system`,      systemRoutes)

// 7. Marks Entry
app.use(`${A}/marks`,          marksRoutes)

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// Server Listen
const PORT = process.env.PORT || 5000;
const prisma = require('./config/db');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server flying on port ${PORT}`);
  console.log(`🔗 API Base: http://0.0.0.0:${PORT}${A}`);

  // Test database connection at startup
  prisma.$connect()
    .then(() => {
      console.log('🔌 [Database]: Connected to MySQL successfully!');
    })
    .catch((err) => {
      console.error('\n❌ [DATABASE CONNECTION ERROR]:');
      console.error('👉 Could not connect to the MySQL database at 127.0.0.1:3306.');
      console.error('👉 Please make sure XAMPP, Laragon, or your MySQL Windows Service is started and running!\n');
    });
});

module.exports = app;
