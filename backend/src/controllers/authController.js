// src/controllers/authController.js
const bcrypt        = require('bcryptjs')
const prisma        = require('../config/db')
const pool          = require('../config/mysqlDb')
const { signToken } = require('../utils/jwt')
const { sendSuccess, sendError } = require('../utils/response')

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// LEAN LOGIN: Validates credentials from users table ONLY.
// No permission/profile/module joins here → zero 500 risk.
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return sendError(res, 'Username and password are required.', 400)
  }

  try {
    // Fetch only from users table — no joins at all
    const user = await prisma.users.findFirst({
      where: username.toLowerCase().trim() === 'admin'
        ? { role: 'admin' }
        : { phone: username.trim() },
      select: {
        id:       true,
        name:     true,
        email:    true,
        password: true,
        role:     true,
        status:   true,
        phone:    true,
      }
    })

    if (!user) {
      console.warn(`[LOGIN] Failed attempt for username: ${username}`)
      return sendError(res, 'Invalid credentials.', 401)
    }

    if (user.status !== 'active') {
      console.warn(`[LOGIN] Inactive account: user_id=${user.id}`)
      return sendError(res, 'Account inactive. Contact your administrator.', 403)
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      console.warn(`[LOGIN] Wrong password for user_id=${user.id}`)
      return sendError(res, 'Invalid credentials.', 401)
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })
    const { password: _, ...userData } = user

    console.log(`[LOGIN] ✅ Success — user_id=${user.id} role=${user.role}`)
    return sendSuccess(res, { token, user: userData }, 'Login successful.')

  } catch (err) {
    console.error('[LOGIN] ❌ Fatal error:', err.message)
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again.'
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Called by frontend immediately after login (refreshUser) and on page reload.
// Returns full user profile + permissions + assigned subjects.
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const userId = req.user.id

    // 1. Fetch base user + teacher profile
    const user = await prisma.users.findUnique({
      where:  { id: userId },
      select: {
        id:             true,
        name:           true,
        email:          true,
        role:           true,
        status:         true,
        phone:          true,
        created_at:     true,
        teacher_profile: true,
      }
    })

    if (!user) return sendError(res, 'User not found.', 404)

    const profile = user.teacher_profile || {}

    const result = {
      id:            user.id,
      name:          user.name,
      email:         user.email,
      role:          user.role,
      status:        user.status,
      phone:         user.phone,
      created_at:    user.created_at,
      mobile:        profile.mobile        || user.phone || '',
      dob:           profile.dob           || '',
      qualification: profile.qualification || '',
      experience:    profile.experience    || '',
      salary:        profile.salary        || '',
      subject:       profile.subject       || '',
      assigned_classes: [],
      permissions:   [],
    }

    // 2. Teacher-specific enrichment (safe — wrapped in try/catch)
    if (user.role === 'teacher') {
      try {
        const [rows] = await pool.execute(`
          SELECT
            ts.subject_id,
            s.name  AS subject_name,
            ts.class_id,
            c.class_name
          FROM teacher_subjects ts
          LEFT JOIN subjects s ON ts.subject_id = s.id
          LEFT JOIN classes   c ON ts.class_id   = c.id
          WHERE ts.teacher_id = ?
        `, [userId])
        result.assigned_classes = rows

      } catch (e) {
        console.warn('[ME] Could not fetch assigned_classes:', e.message)
      }

      try {
        const [permRows] = await pool.execute(`
          SELECT m.module_key AS module, tmp.end_date AS expiresAt
          FROM teacher_module_permissions tmp
          JOIN modules  m ON tmp.module_id  = m.id
          JOIN teachers t ON tmp.teacher_id = t.id
          WHERE t.user_id = ?
            AND tmp.status = 'ACTIVE'
            AND (tmp.end_date >= CURDATE() OR tmp.end_date IS NULL)
        `, [userId])

        result.permissions = permRows.map(p => ({
          module:    p.module,
          allowed:   true,
          expiresAt: p.expiresAt,
        }))

        console.log(`[ME] user_id=${userId} → ${result.permissions.length} active permissions`)

      } catch (e) {
        console.warn('[ME] Could not fetch permissions:', e.message)
        result.permissions = []
      }
    }

    return sendSuccess(res, result)

  } catch (err) {
    console.error('[ME] ❌ Fatal error:', err.message)
    return res.status(500).json({
      success: false,
      message: 'Could not load user profile. Please refresh.'
    })
  }
}

module.exports = { login, getMe }
