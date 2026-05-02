// src/middleware/auth.js
const { verifyToken }   = require('../utils/jwt')
const { sendError }     = require('../utils/response')
const prisma            = require('../config/db')
const pool              = require('../config/mysqlDb')

/**
 * verifyToken – validates Bearer JWT in Authorization header.
 * Attaches `req.user = { id, name, email, role }` on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token' });
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
    console.error('[AUTH ERROR]:', err.message);
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token has expired' });
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ message: 'Invalid token' });
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

/**
 * permissionCheck – checks if teacher has specific module permission.
 * Admins bypass this.
 */
const permissionCheck = (moduleKey) => async (req, res, next) => {
  if (!req.user) return sendError(res, 'Unauthorized', 401)
  
  // Admin bypass
  if (req.user.role === 'admin') return next()
  
  try {
    const [rows] = await pool.execute(`
      SELECT tmp.id 
      FROM teacher_module_permissions tmp
      JOIN modules m ON tmp.module_id = m.id
      JOIN teachers t ON tmp.teacher_id = t.id
      WHERE t.user_id = ? 
        AND m.module_key = ? 
        AND tmp.status = 'ACTIVE' 
        AND tmp.end_date >= CURDATE()
    `, [req.user.id, moduleKey])

    if (rows.length > 0) return next()
    
    return sendError(res, `Forbidden: Missing ${moduleKey} permission`, 403)
  } catch (err) {
    console.error('[PERMISSION CHECK ERROR]:', err)
    return sendError(res, 'Internal server error during permission check', 500)
  }
}

module.exports = { authenticate, roleCheck, permissionCheck }
