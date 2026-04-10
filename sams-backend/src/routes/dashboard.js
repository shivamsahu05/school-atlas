// src/routes/dashboard.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { teacherDashboard, adminDashboard } = require('../controllers/dashboardController')
const { authenticate, roleCheck } = require('../middleware/auth')

router.use(authenticate)

router.get('/teacher', roleCheck('teacher'), asyncHandler(teacherDashboard))
router.get('/admin',   roleCheck('admin'),   asyncHandler(adminDashboard))

module.exports = router
