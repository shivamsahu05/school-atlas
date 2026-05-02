const router     = require('express').Router();
const asyncHandler = require('express-async-handler');
const ctrl       = require('../controllers/teacherScheduleController');
const { authenticate, roleCheck } = require('../middleware/auth');

const { getTeacherObservations } = require('../controllers/observationsController');

// Teacher Profile
router.get('/profile', authenticate, roleCheck('teacher'), asyncHandler(ctrl.getTeacherProfile));
router.put('/profile', authenticate, roleCheck('teacher'), asyncHandler(ctrl.updateTeacherProfile));

// Teacher Analytics / Observations
router.get('/observations', authenticate, roleCheck('teacher'), asyncHandler(getTeacherObservations));

// Teacher Schedule (Legacy prefix)

router.get('/schedule',            authenticate, roleCheck('teacher'), asyncHandler(ctrl.getTeacherSchedule));
router.get('/schedule/assignments', authenticate, roleCheck('teacher'), asyncHandler(ctrl.getMyAssignments));
router.post('/schedule/update',     authenticate, roleCheck('teacher'), asyncHandler(ctrl.updateScheduleStatus));
router.get('/schedule/micro-schedule', authenticate, roleCheck('teacher'), asyncHandler(ctrl.getMicroSchedule));
router.post('/schedule/micro-schedule', authenticate, roleCheck('teacher'), asyncHandler(ctrl.saveMicroSchedule));
router.get('/schedule/subjects',       authenticate, roleCheck('teacher'), asyncHandler(ctrl.getTeacherSubjects));

// Admin timetable management
router.get('/admin',    authenticate, roleCheck('admin'),   asyncHandler(ctrl.getAdminTimetable));
router.post('/admin',   authenticate, roleCheck('admin'),   asyncHandler(ctrl.createTimetableEntry));
router.delete('/admin/:id', authenticate, roleCheck('admin'), asyncHandler(ctrl.deleteTimetableEntry));

module.exports = router;
