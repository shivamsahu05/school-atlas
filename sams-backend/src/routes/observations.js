// src/routes/observations.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getObservations, createObservation } = require('../controllers/observationsController')
const { authenticate, roleCheck } = require('../middleware/auth')
const { validate, createObsSchema } = require('../validators')

router.use(authenticate)

router.get('/',  asyncHandler(getObservations))
// Only admin can record observations
router.post('/', roleCheck('admin'), validate(createObsSchema), asyncHandler(createObservation))

module.exports = router
