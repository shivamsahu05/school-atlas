// src/routes/students.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentsController')
const { authenticate, roleCheck } = require('../middleware/auth')
const { validate, createStudentSchema, updateStudentSchema } = require('../validators')

router.use(authenticate)

router.get('/',    asyncHandler(getStudents))
router.get('/:id', asyncHandler(getStudentById))

// Write operations: admin only
router.post('/',   roleCheck('admin'), validate(createStudentSchema), asyncHandler(createStudent))
router.put('/:id', roleCheck('admin'), validate(updateStudentSchema), asyncHandler(updateStudent))
router.delete('/:id', roleCheck('admin'), asyncHandler(deleteStudent))

module.exports = router
