// src/routes/teacherLo.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getTeacherLO, submitSelfAssessment, awardAdminScore } = require('../controllers/teacherLoController')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/',      asyncHandler(getTeacherLO))
router.post('/self', asyncHandler(submitSelfAssessment))
router.post('/award',asyncHandler(awardAdminScore))

module.exports = router
