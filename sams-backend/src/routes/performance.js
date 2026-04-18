// src/routes/performance.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getTeacherPerformance, getAllPerformance } = require('../controllers/performanceController')
const { authenticate, roleCheck } = require('../middleware/auth')

router.use(authenticate)

// Admin: get all teacher scores
router.get('/all',          roleCheck('admin'), asyncHandler(getAllPerformance))
// Any authenticated user: get specific teacher (role-scoped inside controller)
router.get('/teacher/:id',  asyncHandler(getTeacherPerformance))

module.exports = router
