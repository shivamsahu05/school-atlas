// src/routes/syllabus.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getSyllabus, getSyllabusById, createSyllabus, updateSyllabus } = require('../controllers/syllabusController')
const { authenticate } = require('../middleware/auth')
const { validate, createSyllabusSchema, updateSyllabusSchema } = require('../validators')

router.use(authenticate)

router.get('/',    asyncHandler(getSyllabus))
router.get('/:id', asyncHandler(getSyllabusById))
router.post('/',   validate(createSyllabusSchema), asyncHandler(createSyllabus))
router.put('/:id', validate(updateSyllabusSchema), asyncHandler(updateSyllabus))

module.exports = router
