// src/controllers/authController.js
const bcrypt          = require('bcryptjs')
const prisma          = require('../config/db')
const { signToken }   = require('../utils/jwt')
const { sendSuccess, sendError } = require('../utils/response')

/**
 * POST /api/auth/login
 * Validates credentials, returns JWT + user info.
 */
const login = async (req, res) => {
  const { username, password } = req.body

  if (!username) return sendError(res, 'Username or phone is required.', 400)

  // Logic: literal "admin" -> role admin; otherwise -> search by phone
  let user
  if (username.toLowerCase().trim() === 'admin') {
    user = await prisma.users.findFirst({
      where:  { role: 'admin', status: 'active' },
      select: { id: true, name: true, email: true, password: true, role: true, status: true, phone: true },
    })
  } else {
    user = await prisma.users.findFirst({
      where: { phone: username.trim(), status: 'active' },
      select: { id: true, name: true, email: true, password: true, role: true, status: true, phone: true },
    })
  }

  if (!user) return sendError(res, 'Invalid credentials or account inactive.', 401)

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return sendError(res, 'Invalid credentials.', 401)

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  // Strip password from response
  const { password: _, ...userData } = user

  return sendSuccess(res, { token, user: userData }, 'Login successful.')
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
const getMe = async (req, res) => {
  const user = await prisma.users.findUnique({
    where:  { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, status: true, phone: true, created_at: true },
  })
  if (!user) return sendError(res, 'User not found.', 404)
  return sendSuccess(res, user)
}

module.exports = { login, getMe }
