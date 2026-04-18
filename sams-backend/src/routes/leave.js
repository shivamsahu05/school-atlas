// src/routes/leave.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getLeaves, getLeaveById, createLeave, updateLeave } = require('../controllers/leaveController')
const { authenticate } = require('../middleware/auth')
const { validate, createLeaveSchema, updateLeaveSchema } = require('../validators')

router.use(authenticate)

router.get('/',    asyncHandler(getLeaves))
router.get('/:id', asyncHandler(getLeaveById))
router.post('/',   validate(createLeaveSchema), asyncHandler(createLeave))
router.put('/:id', asyncHandler(updateLeave))   // validation inside controller (role-branched)

module.exports = router
