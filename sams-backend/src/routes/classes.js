// src/routes/classes.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
<<<<<<< HEAD
const {
  getClasses, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getClassSubjects, assignSubjectToClass, removeSubjectFromClass, bulkAssignSubjects,
} = require('../controllers/classesController')
const { authenticate, roleCheck } = require('../middleware/auth')

router.use(authenticate)

// ─── Classes ──────────────────────────────────────────────────────────────────
router.get('/classes',           asyncHandler(getClasses))
router.post('/classes',          roleCheck('admin'), asyncHandler(createClass))
router.put('/classes/:id',       roleCheck('admin'), asyncHandler(updateClass))
router.delete('/classes/:id',    roleCheck('admin'), asyncHandler(deleteClass))

// ─── Subjects ─────────────────────────────────────────────────────────────────
router.get('/subjects',          asyncHandler(getSubjects))
router.post('/subjects',         roleCheck('admin'), asyncHandler(createSubject))
router.put('/subjects/:id',      roleCheck('admin'), asyncHandler(updateSubject))
router.delete('/subjects/:id',   roleCheck('admin'), asyncHandler(deleteSubject))

// ─── Class–Subject Assignments ────────────────────────────────────────────────
router.get('/class-subjects',         asyncHandler(getClassSubjects))
router.post('/class-subjects',        roleCheck('admin'), asyncHandler(assignSubjectToClass))
router.put('/class-subjects/bulk',    roleCheck('admin'), asyncHandler(bulkAssignSubjects))
router.delete('/class-subjects/:id',  roleCheck('admin'), asyncHandler(removeSubjectFromClass))
=======
const { getClasses, getSubjects } = require('../controllers/classesController')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/classes',  asyncHandler(getClasses))
router.get('/subjects', asyncHandler(getSubjects))
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d

module.exports = router
