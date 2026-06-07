// src/routes/marksRoutes.js
const router = require('express').Router();
const asyncHandler = require('express-async-handler');
const ctrl = require('../controllers/marksController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/teacher-options', asyncHandler(ctrl.getTeacherOptions));
router.get('/students', asyncHandler(ctrl.getStudents));
router.get('/history', asyncHandler(ctrl.getHistory));
router.get('/marksheet', asyncHandler(ctrl.getMarksheet));
router.post('/save', asyncHandler(ctrl.saveMarks));
router.post('/unlock', asyncHandler(ctrl.unlockMarks));

module.exports = router;
