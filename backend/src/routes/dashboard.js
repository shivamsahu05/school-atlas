// src/routes/dashboard.js
const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const ctrl = require('../controllers/dashboardController');
const { authenticate, roleCheck } = require('../middleware/auth');

// GET /api/dashboard/admin-metrics  (admin only)
router.get('/admin-metrics', authenticate, roleCheck('admin'), asyncHandler(ctrl.getAdminMetrics));

// GET /api/dashboard/teacher  (teacher only)
router.get('/teacher', authenticate, roleCheck('teacher'), asyncHandler(ctrl.getTeacherDashboard));

// ─── NOTIFICATIONS (Unified) ──────────────────────────────────────────────────
router.get('/homework-notifications', authenticate, roleCheck('admin', 'principal'), asyncHandler(ctrl.getHomeworkNotifications));
router.get('/notifications', authenticate, roleCheck('admin', 'teacher', 'principal'), asyncHandler(ctrl.getNotifications));

module.exports = router;
