// src/middleware/auth.js
const { verifyToken }   = require('../utils/jwt')
const { sendError }     = require('../utils/response')
const prisma            = require('../config/db')

/**
 * verifyToken – validates Bearer JWT in Authorization header.
 * Attaches `req.user = { id, name, email, role }` on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access denied. No token provided.', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    // Confirm user still exists and is active
    const user = await prisma.users.findUnique({
      where:  { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, status: true },
    })

    if (!user) return sendError(res, 'User not found.', 401)
    if (user.status === 'inactive') return sendError(res, 'Account is inactive.', 403)

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendError(res, 'Token has expired. Please log in again.', 401)
    if (err.name === 'JsonWebTokenError')  return sendError(res, 'Invalid token.',  401)
    next(err)
  }
}

/**
 * roleCheck – returns middleware that allows only specified roles.
 * Usage: roleCheck('admin') or roleCheck('admin', 'teacher')
 */
const roleCheck = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, `Access denied. Required role: ${roles.join(' or ')}.`, 403)
  }
  next()
}

module.exports = { authenticate, roleCheck }
