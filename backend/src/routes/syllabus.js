const router         = require('express').Router()
const asyncHandler   = require('express-async-handler')
const { 
  getSyllabus, getSyllabusById, createSyllabus, updateSyllabus, deleteSyllabus, 
  getSyllabusMetadata, downloadTemplate, bulkUploadSyllabus,
  getSyllabusPlan, uploadSyllabusPlan, addMicroSchedule, exportSyllabusPlan,
  debugSyllabus
} = require('../controllers/syllabusController')
const { authenticate } = require('../middleware/auth')
const checkPermission  = require('../middleware/permissionMiddleware')
const { validate, createSyllabusSchema, updateSyllabusSchema } = require('../validators')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

router.use(authenticate)

// 1. Specific Syllabus Plan Routes (Must be before wildcard routes like /:id)
router.get('/plan', asyncHandler(getSyllabusPlan))
router.post('/upload-syllabus', upload.single('file'), asyncHandler(uploadSyllabusPlan))
router.post('/add-micro-schedule', asyncHandler(addMicroSchedule))
router.get('/export-syllabus', asyncHandler(exportSyllabusPlan))
router.get('/debug-data', asyncHandler(debugSyllabus))

// 2. Standard Syllabus Routes
router.get('/',    asyncHandler(getSyllabus))
router.get('/template', asyncHandler(downloadTemplate))
router.get('/metadata', asyncHandler(getSyllabusMetadata))
router.get('/:id', asyncHandler(getSyllabusById))

router.post('/',   checkPermission('SYLLABUS_UPLOAD'), validate(createSyllabusSchema), asyncHandler(createSyllabus))
router.post('/bulk-upload', checkPermission('SYLLABUS_UPLOAD'), upload.single('file'), asyncHandler(bulkUploadSyllabus))
router.put('/:id', checkPermission('SYLLABUS_UPLOAD'), validate(updateSyllabusSchema), asyncHandler(updateSyllabus))
router.delete('/:id', asyncHandler(deleteSyllabus))

module.exports = router
