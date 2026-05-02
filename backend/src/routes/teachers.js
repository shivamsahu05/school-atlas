// src/routes/teachers.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { 
  getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher,
  downloadTeacherTemplate, bulkUploadTeachers,
  getAssignments, saveAssignments, updatePerformance, updateTeacherStatus
} = require('../controllers/teachersController')
const { authenticate, roleCheck } = require('../middleware/auth')
const upload = require('../middleware/upload')
const { validate, createTeacherSchema, updateTeacherSchema } = require('../validators')

// All teacher routes require auth + admin role
router.use(authenticate, roleCheck('admin'))

// Static routes MUST come before dynamic :id routes
router.get('/template-download', asyncHandler(downloadTeacherTemplate))
router.post('/bulk-upload',      upload.single('file'), asyncHandler(bulkUploadTeachers))

router.get('/',    asyncHandler(getTeachers))
router.get('/:id', asyncHandler(getTeacherById))

router.post('/',   validate(createTeacherSchema), asyncHandler(createTeacher))
router.put('/:id', validate(updateTeacherSchema), asyncHandler(updateTeacher))
router.delete('/:id', asyncHandler(deleteTeacher))
router.patch('/:id/status', asyncHandler(updateTeacherStatus))

router.get('/:id/assignments', asyncHandler(getAssignments))
router.post('/:id/assignments', asyncHandler(saveAssignments))
router.put('/:id/performance', asyncHandler(updatePerformance))

module.exports = router
