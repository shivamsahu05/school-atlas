// src/routes/auth.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { login, getMe, updateProfile } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')

router.post('/login',          asyncHandler(login))
router.get ('/me',  authenticate, asyncHandler(getMe))
router.put ('/profile', authenticate, asyncHandler(updateProfile))

module.exports = router
