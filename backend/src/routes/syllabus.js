const router         = require('express').Router()
const asyncHandler   = require('express-async-handler')
const { 
  getSyllabus, getSyllabusById, createSyllabus, updateSyllabus, deleteSyllabus, 
  getSyllabusMetadata, downloadTemplate, bulkUploadSyllabus 
} = require('../controllers/syllabusController')
const { authenticate } = require('../middleware/auth')
const checkPermission  = require('../middleware/permissionMiddleware')
const { validate, createSyllabusSchema, updateSyllabusSchema } = require('../validators')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage() })

router.use(authenticate)

router.get('/',    asyncHandler(getSyllabus))
router.get('/template', asyncHandler(downloadTemplate))
router.get('/metadata', asyncHandler(getSyllabusMetadata))
router.get('/:id', asyncHandler(getSyllabusById))
router.post('/',   checkPermission('SYLLABUS_UPLOAD'), validate(createSyllabusSchema), asyncHandler(createSyllabus))
router.post('/bulk-upload', checkPermission('SYLLABUS_UPLOAD'), upload.single('file'), asyncHandler(bulkUploadSyllabus))
// PUT /:id used for both edit AND markDone (is_completed:true)
router.put('/:id', checkPermission('SYLLABUS_UPLOAD'), validate(updateSyllabusSchema), asyncHandler(updateSyllabus))
router.delete('/:id', asyncHandler(deleteSyllabus))

module.exports = router
