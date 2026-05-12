// src/routes/students.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { 
  getStudents, getStudentById, createStudent, updateStudent, deleteStudent,
  downloadStudentTemplate, bulkUploadStudents, handleLifecycle
} = require('../controllers/studentsController')
const { authenticate, roleCheck, permissionCheck } = require('../middleware/auth')
const upload = require('../middleware/upload')
const { validate, createStudentSchema, updateStudentSchema } = require('../validators')

router.use(authenticate)

// All student operations require students_management permission (or admin bypass)
router.use(permissionCheck('students_management'))

// Static routes MUST come before dynamic :id routes
router.get('/template-download', asyncHandler(downloadStudentTemplate))
router.post('/bulk-upload',      upload.single('file'), asyncHandler(bulkUploadStudents))

router.get('/',    asyncHandler(getStudents))
router.get('/:id', asyncHandler(getStudentById))

// Write operations
router.post('/',   validate(createStudentSchema), asyncHandler(createStudent))
router.put('/:id', validate(updateStudentSchema), asyncHandler(updateStudent))
router.delete('/:id', asyncHandler(deleteStudent))

// Lifecycle management
router.post('/:id/lifecycle', asyncHandler(handleLifecycle))

module.exports = router
