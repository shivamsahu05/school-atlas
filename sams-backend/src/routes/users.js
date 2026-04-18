// src/routes/users.js
const router       = require('express').Router()
const asyncHandler = require('express-async-handler')
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/usersController')
const { authenticate, roleCheck } = require('../middleware/auth')
const { validate, createUserSchema, updateUserSchema } = require('../validators')

// All user routes require auth + admin role
router.use(authenticate, roleCheck('admin'))

router.get('/',    asyncHandler(getUsers))
router.get('/:id', asyncHandler(getUserById))
router.post('/',   validate(createUserSchema), asyncHandler(createUser))
router.put('/:id', validate(updateUserSchema), asyncHandler(updateUser))
router.delete('/:id', asyncHandler(deleteUser))

module.exports = router
