// src/routes/teacherLo.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const ctrl         = require('../controllers/teacherLoController')
const { authenticate, roleCheck } = require('../middleware/auth')

router.use(authenticate)

// Summary MUST be before /:id to avoid param clash
router.get('/summary',  asyncHandler(ctrl.getSummary))          // GET /api/teacher-lo/summary
router.get('/',         asyncHandler(ctrl.getTeacherLO))        // GET /api/teacher-lo
router.post('/',        asyncHandler(ctrl.submitSelfAssessment)) // POST /api/teacher-lo (teacher self-submit)
router.get('/:id',      asyncHandler(ctrl.getTeacherLO))        // GET  /api/teacher-lo/:id (fallback to list)
router.put('/:id',      asyncHandler(ctrl.submitSelfAssessment)) // PUT  /api/teacher-lo/:id (upsert)
router.delete('/:id',   asyncHandler(ctrl.getTeacherLO))        // DELETE placeholder (noop-safe)

// Explicit named routes
router.get('/assignments', asyncHandler(ctrl.getAssignedClasses))
router.get('/topics',      asyncHandler(ctrl.getSyllabusTopics))
router.post('/self',       asyncHandler(ctrl.submitSelfAssessment))
router.post('/award',      roleCheck('admin'), asyncHandler(ctrl.awardAdminScore))

module.exports = router
