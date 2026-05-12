// src/routes/teacherLo.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const ctrl         = require('../controllers/teacherLoController')
const { authenticate, roleCheck } = require('../middleware/auth')

router.use(authenticate)

// Summary MUST be before /:id to avoid param clash
router.get('/summary',  asyncHandler(ctrl.getSummary))          // GET /api/teacher-lo/summary
router.get('/',         asyncHandler(ctrl.getTeacherLO))        // GET /api/teacher-lo
router.post('/',        roleCheck('admin'), asyncHandler(ctrl.submitSelfAssessment)) // Blocked for teachers
router.get('/:id',      asyncHandler(ctrl.getTeacherLO))        
router.put('/:id',      roleCheck('admin'), asyncHandler(ctrl.submitSelfAssessment)) 
router.delete('/:id',   roleCheck('admin'), asyncHandler(ctrl.getTeacherLO))        

// Explicit named routes
router.get('/assignments', asyncHandler(ctrl.getAssignedClasses))
router.get('/topics',      asyncHandler(ctrl.getSyllabusTopics))
router.post('/self',       roleCheck('admin'), asyncHandler(ctrl.submitSelfAssessment))
router.post('/award',      roleCheck('admin'), asyncHandler(ctrl.awardAdminScore))

module.exports = router
