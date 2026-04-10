// src/routes/classes.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getClasses, getSubjects } = require('../controllers/classesController')
const { authenticate } = require('../middleware/auth')

router.use(authenticate)

router.get('/classes',  asyncHandler(getClasses))
router.get('/subjects', asyncHandler(getSubjects))

module.exports = router
