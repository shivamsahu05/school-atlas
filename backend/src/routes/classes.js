// src/routes/classes.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const {
  getSimpleClasses, getClasses, getClassSections, createClass, updateClass, deleteClass,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getClassSubjects, assignSubject, unassignSubject, bulkAssignSubjects,
} = require('../controllers/academicController')
const { authenticate, roleCheck } = require('../middleware/auth')

// ─── Classes ──────────────────────────────────────────────────────────────────
router.get('/classes',           authenticate, asyncHandler(getSimpleClasses))
router.get('/classes/:classId/sections', authenticate, asyncHandler(getClassSections))
router.post('/classes',          authenticate, roleCheck('admin'), asyncHandler(createClass))
router.put('/classes/:id',       authenticate, roleCheck('admin'), asyncHandler(updateClass))
router.delete('/classes/:id',    authenticate, roleCheck('admin'), asyncHandler(deleteClass))

// ─── Subjects ─────────────────────────────────────────────────────────────────
router.get('/subjects',          authenticate, asyncHandler(getSubjects))
router.post('/subjects',         authenticate, roleCheck('admin'), asyncHandler(createSubject))
router.put('/subjects/:id',      authenticate, roleCheck('admin'), asyncHandler(updateSubject))
router.delete('/subjects/:id',   authenticate, roleCheck('admin'), asyncHandler(deleteSubject))

// ─── Class–Subject Assignments ────────────────────────────────────────────────
router.get('/class-subjects',         authenticate, asyncHandler(getClassSubjects))
router.post('/class-subjects',        authenticate, roleCheck('admin'), asyncHandler(assignSubject))
// router.put('/class-subjects/bulk',    authenticate, roleCheck('admin'), asyncHandler(bulkAssignSubjects))
router.delete('/class-subjects/:id',  authenticate, roleCheck('admin'), asyncHandler(unassignSubject))

module.exports = router
