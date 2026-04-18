// src/routes/academic.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const ctrl         = require('../controllers/academicController')
const { authenticate, roleCheck } = require('../middleware/auth')

router.use(authenticate)
const admin = roleCheck('admin')

// ─── Classes ──────────────────────────────────────────────────────────────────
router.get('/classes',                    asyncHandler(ctrl.getClasses))
router.post('/classes-extended',    admin, asyncHandler(ctrl.createClass))
router.put('/classes-extended/:id', admin, asyncHandler(ctrl.updateClass))
router.delete('/classes/:id',       admin, asyncHandler(ctrl.deleteClass))

// ─── Sections ─────────────────────────────────────────────────────────────────
router.get('/sections',                   asyncHandler(ctrl.getSections))
router.post('/sections',            admin, asyncHandler(ctrl.createSection))
router.put('/sections/:id',         admin, asyncHandler(ctrl.updateSection))
router.delete('/sections/:id',      admin, asyncHandler(ctrl.deleteSection))

// ─── Subjects ─────────────────────────────────────────────────────────────────
router.get('/subjects',                   asyncHandler(ctrl.getSubjects))
router.post('/subjects',            admin, asyncHandler(ctrl.createSubject))
router.put('/subjects/:id',         admin, asyncHandler(ctrl.updateSubject))
router.delete('/subjects/:id',      admin, asyncHandler(ctrl.deleteSubject))

// ─── Class ↔ Section ─────────────────────────────────────────────────────────
router.get('/class-sections/:classId',            asyncHandler(ctrl.getClassSections))
router.post('/class-sections',              admin, asyncHandler(ctrl.assignSection))
router.delete('/class-sections/:id',        admin, asyncHandler(ctrl.unassignSection))
router.delete('/class-sections-by-params',  admin, asyncHandler(ctrl.unassignSectionByParams))

// ─── Class ↔ Subject ────────────────────────────────────────────────────────
router.get('/class-subjects/:classId',            asyncHandler(ctrl.getClassSubjects))
router.post('/class-subjects',              admin, asyncHandler(ctrl.assignSubject))
router.delete('/class-subjects/:id',        admin, asyncHandler(ctrl.unassignSubject))
router.delete('/class-subjects-by-params',  admin, asyncHandler(ctrl.unassignSubjectByParams))

// ─── Unified Subject Assignment ───────────────────────────────────────────────
router.post('/subject-assignments',         admin, asyncHandler(ctrl.assignSubjectUnified))

// ─── Streams / Groups ────────────────────────────────────────────────────────
router.get('/streams',                    asyncHandler(ctrl.getStreams))
router.post('/streams',             admin, asyncHandler(ctrl.createStream))
router.put('/streams/:id',          admin, asyncHandler(ctrl.updateStream))
router.delete('/streams/:id',       admin, asyncHandler(ctrl.deleteStream))

// ─── Class ↔ Stream Link ────────────────────────────────────────────────────
router.get('/class-streams/:classId',             asyncHandler(ctrl.getClassStreams))
router.post('/class-streams',               admin, asyncHandler(ctrl.linkStream))
router.delete('/class-streams/:id',         admin, asyncHandler(ctrl.unlinkStream))

module.exports = router
