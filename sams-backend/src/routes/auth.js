// src/routes/auth.js
const router  = require('express').Router()
const asyncHandler = require('express-async-handler')
const { login, getMe }           = require('../controllers/authController')
const { authenticate }           = require('../middleware/auth')
const { validate, loginSchema }  = require('../validators')

// POST /api/auth/login
router.post('/login', validate(loginSchema), asyncHandler(login))

// GET /api/auth/me  (protected)
router.get('/me', authenticate, asyncHandler(getMe))

module.exports = router
