const express = require('express');
const router = express.Router();
const lmsIntelligenceController = require('../controllers/lmsIntelligenceController');
const { authenticate, roleCheck } = require('../middleware/auth');

// Dashboard Data
router.get('/teacher-dashboard', authenticate, roleCheck('teacher', 'admin'), lmsIntelligenceController.getTeacherDashboard);
router.get('/admin-dashboard',   authenticate, roleCheck('admin'),            lmsIntelligenceController.getAdminDashboard);

// Intelligence APIs
router.get('/micro-intelligence', authenticate, roleCheck('teacher', 'admin'), lmsIntelligenceController.getMicroIntelligence);
router.get('/lo-intelligence',    authenticate, roleCheck('teacher', 'admin'), lmsIntelligenceController.getLOIntelligence);
router.get('/analytics',          authenticate, roleCheck('teacher', 'admin'), lmsIntelligenceController.getAnalytics);

// Notifications
router.get('/notifications', authenticate, lmsIntelligenceController.getNotifications);

// Engine
router.post('/run-engine', authenticate, roleCheck('admin'), lmsIntelligenceController.runIntelligenceEngine);

module.exports = router;
