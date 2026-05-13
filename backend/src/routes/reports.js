const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const ctrl = require('../controllers/adminReportController');
const { authenticate, roleCheck } = require('../middleware/auth');

router.get('/completion-report', authenticate, roleCheck('admin', 'principal'), asyncHandler(ctrl.getCompletionReport));
router.get('/completion-report/export', authenticate, roleCheck('admin', 'principal'), asyncHandler(ctrl.exportCompletionReport));

module.exports = router;
