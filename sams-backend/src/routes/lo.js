// src/routes/lo.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getLO, createLO, updateLO } = require('../controllers/loController')
const { authenticate } = require('../middleware/auth')
const { validate, createLOSchema, updateLOSchema } = require('../validators')

router.use(authenticate)

router.get('/',    asyncHandler(getLO))
router.post('/',   validate(createLOSchema), asyncHandler(createLO))
router.put('/:id', validate(updateLOSchema), asyncHandler(updateLO))

module.exports = router
