const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const {
  getHomework, getHomeworkById, getSubmissions,
  createHomework, submitHomework, submitHomeworkBulk, updateSubmission, deleteHomework,
} = require('../controllers/homeworkController')
const { authenticate }   = require('../middleware/auth')
const checkPermission     = require('../middleware/permissionMiddleware')
const { validate, createHomeworkSchema, submitHomeworkSchema, updateSubmissionSchema } = require('../validators')

router.use(authenticate)

router.get('/',                   asyncHandler(getHomework))
router.get('/:id',                asyncHandler(getHomeworkById))
router.get('/:id/submissions',    asyncHandler(getSubmissions))
router.post('/',                  checkPermission('HOMEWORK_ENTRY'), validate(createHomeworkSchema), asyncHandler(createHomework))
router.post('/:id/submissions',   asyncHandler(submitHomeworkBulk))          // bulk marks entry
router.post('/:id/submit',        validate(submitHomeworkSchema), asyncHandler(submitHomework))
router.put('/submission/:id',     validate(updateSubmissionSchema), asyncHandler(updateSubmission))
router.delete('/:id',             asyncHandler(deleteHomework))

module.exports = router
