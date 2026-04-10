// src/app.js
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { errorHandler, notFound } = require('./middleware/errorHandler');

// ─── Route modules ────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const usersRoutes       = require('./routes/users');
const studentsRoutes    = require('./routes/students');
const classesRoutes     = require('./routes/classes');
const syllabusRoutes    = require('./routes/syllabus');
const homeworkRoutes    = require('./routes/homework');
const loRoutes          = require('./routes/lo');
const observationRoutes = require('./routes/observations');
const performanceRoutes = require('./routes/performance');
const leaveRoutes       = require('./routes/leave');
const dashboardRoutes   = require('./routes/dashboard');

// ─── App Setup ────────────────────────────────────────────────────────────────
const app  = express();
const PORT = Number(process.env.PORT) || 5000;   // ✅ Single declaration — DO NOT duplicate

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Root Route (Render health-check hits "/" by default) ─────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'SAMS API', version: '1.0.0' });
});

// ─── /health Route ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'SAMS API',
    version:   '1.0.0',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api';

app.use(`${API}/auth`,         authRoutes);
app.use(`${API}/users`,        usersRoutes);
app.use(`${API}/students`,     studentsRoutes);
app.use(`${API}`,              classesRoutes);   // /api/classes + /api/subjects
app.use(`${API}/syllabus`,     syllabusRoutes);
app.use(`${API}/homework`,     homeworkRoutes);
app.use(`${API}/lo`,           loRoutes);
app.use(`${API}/observations`, observationRoutes);
app.use(`${API}/performance`,  performanceRoutes);
app.use(`${API}/leave`,        leaveRoutes);
app.use(`${API}/dashboard`,    dashboardRoutes);

// ─── 404 & Global Error Handlers ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Server Start ─────────────────────────────────────────────────────────────
// Only start listening when run directly: node src/app.js
// When require()'d by a serverless wrapper, skip listen().
if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   SAMS API SERVER — STARTED            ║');
    console.log(`║   PORT : ${PORT}                       ║`);
    console.log(`║   ENV  : ${(process.env.NODE_ENV || 'development').padEnd(27)}║`);
    console.log('║   HOST : 0.0.0.0                       ║');
    console.log('╚════════════════════════════════════════╝');
  });

  // ── Graceful Shutdown ────────────────────────────────────────────────────
  process.on('SIGTERM', () => {
    console.log('SIGTERM received — shutting down gracefully…');
    server.close(() => process.exit(0));
  });

  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Rejection:', reason);
    process.exit(1);
  });
}

// Export for testing or serverless wrappers
module.exports = app;