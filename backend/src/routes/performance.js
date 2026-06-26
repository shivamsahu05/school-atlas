// src/routes/performance.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getTeacherPerformance, getAllPerformance, savePerformanceOverride } = require('../controllers/performanceController')
const { authenticate, roleCheck } = require('../middleware/auth')

router.use(authenticate)

// Admin only: all teacher scores
router.get('/all',          roleCheck('admin'), asyncHandler(getAllPerformance))
router.post('/override',    roleCheck('admin'), asyncHandler(savePerformanceOverride))

// Teacher self: GET /api/performance/me — no 403, uses req.user.id
router.get('/me',           asyncHandler((req, res) => {
  req.params.id = String(req.user.id)
  return getTeacherPerformance(req, res)
}))

// Any authenticated: specific teacher (controller guards role)
router.get('/teacher/:id',  asyncHandler(getTeacherPerformance))

module.exports = router

