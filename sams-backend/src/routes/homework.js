// src/routes/homework.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const {
  getHomework, getHomeworkById, getSubmissions,
  createHomework, submitHomework, updateSubmission,
} = require('../controllers/homeworkController')
const { authenticate } = require('../middleware/auth')
const { validate, createHomeworkSchema, submitHomeworkSchema, updateSubmissionSchema } = require('../validators')

router.use(authenticate)

router.get('/',                        asyncHandler(getHomework))
router.get('/:id',                     asyncHandler(getHomeworkById))
router.get('/:id/submissions',         asyncHandler(getSubmissions))
router.post('/',                       validate(createHomeworkSchema), asyncHandler(createHomework))
router.post('/:id/submit',             validate(submitHomeworkSchema), asyncHandler(submitHomework))
router.put('/submission/:id',          validate(updateSubmissionSchema), asyncHandler(updateSubmission))

module.exports = router
