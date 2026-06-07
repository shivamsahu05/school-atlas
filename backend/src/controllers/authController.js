// src/controllers/authController.js
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const pool = require('../config/mysqlDb')
const { signToken } = require('../utils/jwt')
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
      where:  { role: 'admin' },
      select: { id: true, name: true, email: true, password: true, role: true, status: true, phone: true },
    })
  } else {
    user = await prisma.users.findFirst({
      where: { phone: username.trim() },
      select: { id: true, name: true, email: true, password: true, role: true, status: true, phone: true },
    })
  }

  if (!user) return sendError(res, 'Invalid credentials.', 401)
  
  if (user.status !== 'active') {
    return sendError(res, 'Account inactive.', 403)
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return sendError(res, 'Invalid credentials.', 401)

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  // Strip password from response
  const { password: _, ...userData } = user

  // 3. If teacher, fetch permissions
  userData.permissions = []
  if (user.role === 'teacher') {
    try {
      const [permRows] = await pool.execute(`
        SELECT m.module_key AS module, tmp.status, tmp.end_date AS expiresAt
        FROM teacher_module_permissions tmp
        JOIN modules m ON tmp.module_id = m.id
        JOIN teachers t ON tmp.teacher_id = t.id
<<<<<<< HEAD
        WHERE t.user_id = ? AND tmp.status = 'ACTIVE' AND (tmp.end_date IS NULL OR tmp.end_date >= CURDATE())
=======
        WHERE t.user_id = ? AND tmp.status = 'ACTIVE' AND tmp.end_date >= CURDATE()
>>>>>>> 9a27384e83e581220d2d2b72cbd45f72bed0a915
      `, [user.id])
      
      console.log(`[AUTH LOGIN DEBUG] Found ${permRows.length} permissions for user ${user.id}`);
      
      userData.permissions = permRows.map(p => ({
        module: p.module,
        allowed: true,
        expiresAt: p.expiresAt
      }))
    } catch (permErr) {
      console.warn('[AUTH LOGIN] Could not fetch permissions:', permErr.message);
      userData.permissions = [];
    }
  }

  return sendSuccess(res, { token, user: userData }, 'Login successful.')
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Fetch User and Profile using Raw SQL for maximum reliability
    const [users] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.phone, u.created_at,
             t.mobile as profile_mobile, t.dob, t.qualification, t.experience, t.salary, t.subject
      FROM users u
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.id = ?
    `, [userId]);

    if (!users.length) return sendError(res, 'User not found.', 404);
    const user = users[0];

    // 2. Format Result
    const result = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      created_at: user.created_at,
      mobile: user.profile_mobile || user.phone || '',
      dob: user.dob || '',
      qualification: user.qualification || '',
      experience: user.experience || '',
      salary: user.salary || '',
      subject: user.subject || '',
      assigned_classes: []
    };

    // 3. Fetch Teacher Subjects/Permissions if applicable
    if (user.role === 'teacher') {
      try {
        const [subjects] = await pool.execute(`
          SELECT ts.subject_id, s.name as subject_name, ts.class_id, ac.name as class_name
          FROM teacher_subjects ts
          LEFT JOIN subjects s ON ts.subject_id = s.id
          LEFT JOIN academic_classes ac ON ts.class_id = ac.id
          WHERE ts.teacher_id = (SELECT id FROM teachers WHERE user_id = ? LIMIT 1)
        `, [userId]);
        result.assigned_classes = subjects;
        
        const [permissions] = await pool.execute(`
<<<<<<< HEAD
          SELECT m.module_key AS module, tmp.end_date AS expiresAt
          FROM teacher_module_permissions tmp
          JOIN modules m ON tmp.module_id = m.id
          WHERE tmp.teacher_id = (SELECT id FROM teachers WHERE user_id = ? LIMIT 1)
          AND tmp.status = 'ACTIVE' AND (tmp.end_date IS NULL OR tmp.end_date >= CURDATE())
        `, [userId]);
        result.permissions = permissions.map(p => ({
          module: p.module,
          allowed: true,
          expiresAt: p.expiresAt
        }));
=======
          SELECT m.module_key 
          FROM teacher_module_permissions tmp
          JOIN modules m ON tmp.module_id = m.id
          WHERE tmp.teacher_id = (SELECT id FROM teachers WHERE user_id = ? LIMIT 1)
          AND tmp.status = 'ACTIVE'
        `, [userId]);
        result.permissions = permissions.map(p => p.module_key);
>>>>>>> 9a27384e83e581220d2d2b72cbd45f72bed0a915
      } catch (e) {
        console.error('[AUTH ME DEBUG] Permission Fetch Error:', e.message);
        result.permissions = [];
      }
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[GET ME FATAL ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error during auth sync.' });
  }
}

module.exports = { login, getMe }
