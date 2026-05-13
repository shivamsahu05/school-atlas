// src/controllers/teachersController.js
const pool = require('../config/mysqlDb');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// Helper: send standard response
const sendResponse = (res, success, data, message = '', status = 200) => {
  return res.status(status).json({ success, data, message });
};

/**
 * GET /api/teachers
 */
exports.getTeachers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 1000 } = req.query; // Increased default limit for mapping stability
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, t.id AS teacher_id, u.name, u.email, u.role, u.phone, u.created_at,
             COALESCE(t.mobile, u.phone) as mobile, t.dob, t.qualification, t.experience, t.salary, t.subject,
             t.status, t.is_deleted, p.overall_score as rating
      FROM users u
      LEFT JOIN teachers t ON u.id = t.user_id
      LEFT JOIN performance_scores p ON p.teacher_id = u.id
      WHERE u.role = 'teacher' AND (t.is_deleted = FALSE OR t.is_deleted IS NULL)
    `;
    const params = [];

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    let rows = [];
    try {
      [rows] = await pool.execute(query, params);
    } catch (queryErr) {
      console.warn("Teachers JOIN failed, falling back to basic users table:", queryErr.message);
      let fbQuery = `
        SELECT u.id, u.name, u.email, u.role, u.phone, u.status, u.created_at,
               t.mobile, t.dob, t.qualification, t.experience, t.salary, t.subject
        FROM users u
        LEFT JOIN teachers t ON u.id = t.user_id
        WHERE u.role = 'teacher'
      `;
      const fbParams = [];
      if (status) { fbQuery += ` AND status = ?`; fbParams.push(status); }
      if (search) { fbQuery += ` AND (name LIKE ? OR email LIKE ?)`; fbParams.push(`%${search}%`, `%${search}%`); }
      fbQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      fbParams.push(Number(limit), Number(offset));
      [rows] = await pool.execute(fbQuery, fbParams);
    }

    const [[{ total }]] = await pool.execute("SELECT COUNT(*) as total FROM users WHERE role = 'teacher'");

    // Fetch class assignments for these teachers
    const teacherIds = rows.map(r => r.id);
    let classAssignments = [];
    let subjectAssignments = [];
    
    if (teacherIds.length > 0) {
      const [classRows] = await pool.query(`
        SELECT tca.teacher_id, 
               COALESCE(ac.name, '') as class_name, 
               COALESCE(s.name, '') as section_name
        FROM teacher_class_assignments tca
        LEFT JOIN academic_classes ac ON tca.class_id = ac.id
        LEFT JOIN acad_sections s ON tca.section_id = s.id
        WHERE tca.teacher_id IN (?)
      `, [teacherIds]);
      classAssignments = classRows;

      const [subjectRows] = await pool.query(`
        SELECT ts.teacher_id, ts.class_id, ts.subject_id, sub.name as subject_name,
               COALESCE(ac.name, c.class_name, '') as class_name, 
               COALESCE(asec.name, c.section, '') as section
        FROM teacher_subjects ts
        JOIN subjects sub ON ts.subject_id = sub.id
        LEFT JOIN academic_classes ac ON ts.class_id = ac.id
        LEFT JOIN acad_sections asec ON ts.class_id = ac.id -- Join acad_sections via academic_classes if possible, or mapping
        LEFT JOIN classes c ON ts.class_id = c.id AND ac.id IS NULL
        WHERE ts.teacher_id IN (?)
      `, [teacherIds]);
      subjectAssignments = subjectRows;
    }

    // Attach to rows
    const items = rows.map(r => ({
      ...r,
      assignedClasses: classAssignments
        .filter(a => a.teacher_id === r.id)
        .map(a => `${a.class_name}-${a.section_name}`),
      subjectAssignments: subjectAssignments
        .filter(a => a.teacher_id === r.id)
        .map(a => ({
          subject: a.subject_name,
          class: `${a.class_name}-${a.section}`
        }))
    }));

    return res.status(200).json({
      success: true,
      message: 'Action completed',
      data: {
        items,
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('getTeachers Error:', error);
    return sendResponse(res, false, null, 'Failed to fetch teachers.', 500);
  }
};

/**
 * GET /api/teachers/:id
 */
exports.getTeacherById = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.role, u.phone, u.status, u.created_at,
             tp.mobile, tp.dob, tp.qualification, tp.experience, tp.salary, tp.subject, tp.joining_date, tp.address
      FROM users u
      LEFT JOIN teachers tp ON u.id = tp.user_id
      WHERE u.id = ? AND u.role = 'teacher'
    `, [req.params.id]);

    if (rows.length === 0) return sendResponse(res, false, null, 'Teacher not found.', 404);
    return sendResponse(res, true, rows[0]);
  } catch (error) {
    return sendResponse(res, false, null, 'Error fetching teacher.', 500);
  }
};

/**
 * POST /api/teachers
 */
exports.createTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { name, email, password, phone, status,
            mobile, dob, qualification, experience, salary, subject, joining_date, address } = req.body;

    const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      connection.release();
      return sendResponse(res, false, null, 'Email already exists.', 409);
    }

    const hashed = await bcrypt.hash(password || '123456', SALT_ROUNDS);
    
    // 1. Create User
    const [uResult] = await connection.execute(
      'INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashed, 'teacher', phone || mobile || '', status || 'active']
    );

    const userId = uResult.insertId;

    // 2. Create Profile
    await connection.execute(
      `INSERT INTO teachers 
       (user_id, mobile, dob, qualification, experience, salary, subject) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, mobile || phone || '', dob || null, qualification || '', experience || '', salary || '', subject || '']
    );

    await connection.commit();
    return sendResponse(res, true, { id: userId }, 'Teacher created.', 201);
  } catch (error) {
    await connection.rollback();
    console.error('createTeacher Error:', error);
    return res.status(500).json({ success: false, message: 'Transaction failed safely', error: error.message });
  } finally {
    connection.release();
  }
};

/**
 * PUT /api/teachers/:id
 */
exports.updateTeacher = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const id = req.params.id;
    const { name, email, phone, mobile, dob, qualification, experience, salary, subject } = req.body;

    // Update User (Safe Partial)
    await connection.execute(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE id = ?',
      [name ?? null, email ?? null, (phone || mobile) ?? null, id]
    );

    // Update or Insert Profile
    const [existingProfile] = await connection.execute('SELECT id FROM teachers WHERE user_id = ?', [id]);
    if (existingProfile.length > 0) {
      await connection.execute(
        `UPDATE teachers SET mobile=COALESCE(?, mobile), dob=COALESCE(?, dob), qualification=COALESCE(?, qualification), experience=COALESCE(?, experience), salary=COALESCE(?, salary), subject=COALESCE(?, subject) WHERE user_id=?`,
        [mobile ?? null, dob ?? null, qualification ?? null, experience ?? null, salary ?? null, subject ?? null, id]
      );
    } else {
      await connection.execute(
        `INSERT INTO teachers (user_id, mobile, dob, qualification, experience, salary, subject) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, mobile || '', dob || null, qualification || '', experience || '', salary || '', subject || '']
      );
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: 'Teacher updated safely.' });
  } catch (error) {
    if (connection) await connection.rollback();
    return res.status(500).json({ success: false, message: 'Update failed safely', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * DELETE /api/teachers/:id
 */
exports.deleteTeacher = async (req, res) => {
  try {
    const id = req.params.id;
    if (id == req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete self.' });
    
    await pool.execute('UPDATE teachers SET is_deleted = TRUE WHERE user_id = ?', [id]);
    return res.status(200).json({ success: true, message: 'Action completed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Delete failed safely.' });
  }
};

/**
 * PATCH /api/teachers/:id/status
 */
exports.updateTeacherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    await pool.execute('UPDATE teachers SET status = ? WHERE user_id = ?', [status, id]);
    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status === 'blocked' ? 'inactive' : 'active', id]);
    return res.status(200).json({ success: true, message: 'Action completed', data: { status } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Status update failed.' });
  }
};

/**
 * GET /api/teachers/template-download
 */
exports.downloadTeacherTemplate = async (req, res) => {
  try {
    const headers = [
      'Full Name', 'Email', 'Password', 'Phone (used for Login)', 'Mobile', 
      'Date of Birth', 'Subject', 'Experience', 'Qualification', 'Salary'
    ];

    const sampleData = [
      ['Jane Doe', 'jane@school.com', 'Jane@123#', '9876543210', '9876543211', '1990-05-15', 'Maths', '5 Years', 'M.Sc, B.Ed', '45000']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=teacher_bulk_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (error) {
    console.error('Teacher Template Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate template.' });
  }
};

/**
 * GET /api/teachers/export
 */
exports.exportTeachers = async (req, res) => {
  try {
    const query = `
      SELECT u.name, u.email, u.phone as login_phone, '' as password, t.mobile, t.subject, 
             t.qualification, t.experience, t.salary, u.status
      FROM users u
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.role = 'teacher' AND (t.is_deleted = FALSE OR t.is_deleted IS NULL)
      ORDER BY u.name ASC
    `;
    const [rows] = await pool.execute(query);

    const headers = ['Name', 'Email', 'Login Phone', 'Password', 'Mobile', 'Subject', 'Qualification', 'Experience', 'Salary', 'Status'];
    const data = rows.map(r => [
      r.name, r.email, r.login_phone || '', '', r.mobile || '', r.subject || '', 
      r.qualification || '', r.experience || '', r.salary || '', r.status || 'active'
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=teachers_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (error) {
    console.error('Teacher Export Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export teachers.' });
  }
};

/**
 * POST /api/teachers/bulk-upload
 */
exports.bulkUploadTeachers = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const results = { total: rows.length, success: 0, failed: 0, errors: [] };

    for (const [index, row] of rows.entries()) {
      const connection = await pool.getConnection();
      try {
        const name = row['Full Name'] || row['Name'];
        const email = row['Email'];
        const password = row['Password'] || '123456';
        const phone = row['Phone (used for Login)'] || row['Login Phone'];
        const mobile = row['Mobile'];
        const dob = row['Date of Birth'] || row['DOB'];
        const subject = row['Subject'];
        const experience = row['Experience'];
        const qualification = row['Qualification'];
        const salary = row['Salary'];

        if (!name || !email) {
          results.failed++;
          results.errors.push(`Row ${index + 2}: Name and Email are mandatory.`);
          continue;
        }

        // Email conflict check
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
          results.failed++;
          results.errors.push(`Row ${index + 2}: Email ${email} already registered.`);
          continue;
        }

        await connection.beginTransaction();
        const hashed = await bcrypt.hash(String(password), SALT_ROUNDS);
        
        // 1. Create User
        const [uResult] = await connection.execute(
          'INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
          [name, email, hashed, 'teacher', String(phone || mobile || ''), 'active']
        );

        const userId = uResult.insertId;

        // 2. Create Profile
        // Handle Excel Date if numeric
        let formattedDob = dob;
        if (typeof dob === 'number') {
           // Excel serial date to JS date
           formattedDob = new Date((dob - (25567 + 2)) * 86400 * 1000);
        }

        await connection.execute(
          `INSERT INTO teachers (user_id, mobile, dob, qualification, experience, salary, subject) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, mobile || '', formattedDob || null, qualification || '', experience || '', salary || '', subject || '']
        );

        await connection.commit();
        results.success++;
      } catch (err) {
        if (connection) await connection.rollback();
        results.failed++;
        results.errors.push(`Row ${index + 2}: ${err.message}`);
      } finally {
        connection.release();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Import finished: ${results.success} success, ${results.failed} failed.`,
      data: results
    });
  } catch (error) {
    console.error('[BULK UPLOAD ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Bulk processing failed: ' + error.message });
  }
};

/**
 * GET /api/teachers/:id/assignments
 */
exports.getAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT
        tca.class_id,
        tca.section_id,
        ac.name AS class_name,
        s.name AS section_name
      FROM teacher_class_assignments tca
      JOIN academic_classes ac ON ac.id = tca.class_id
      JOIN acad_sections s ON s.id = tca.section_id
      WHERE tca.teacher_id = ?
    `;
    const [rows] = await pool.execute(sql, [id]);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getAssignments Error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch assignments.' });
  }
};

/**
 * POST /api/teachers/:id/assignments
 */
exports.saveAssignments = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const assignments = req.body;
    
    const [teachers] = await connection.execute('SELECT status, is_deleted FROM teachers WHERE user_id = ?', [id]);
    if (teachers.length === 0 || teachers[0].is_deleted) {
      return res.status(404).json({ success: false, message: 'Teacher not found or deleted.' });
    }
    if (teachers[0].status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Cannot assign classes to a blocked teacher.' });
    }

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ success: false, message: 'Assignments must be an array.' });
    }

    await connection.beginTransaction();
    await connection.execute('DELETE FROM teacher_class_assignments WHERE teacher_id = ?', [id]);

    if (assignments.length > 0) {
      const sql = 'INSERT INTO teacher_class_assignments (teacher_id, class_id, section_id, academic_year) VALUES ?';
      const values = assignments.map(a => [id, a.class_id, a.section_id, '2024-2025']);
      
      await connection.query(sql, [values]);
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: 'Assignments saved safely.', data: assignments });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('saveAssignments Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save assignments.' });
  } finally {
    if (connection) connection.release();
  }
};

/**
 * PUT /api/teachers/:id/performance
 */
exports.updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    let { rating, remarks } = req.body;

    rating = parseFloat(rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }
    
    const [teachers] = await pool.execute('SELECT status, is_deleted FROM teachers WHERE user_id = ?', [id]);
    if (teachers.length === 0 || teachers[0].is_deleted) {
      return res.status(404).json({ success: false, message: 'Teacher not found or deleted.' });
    }
    if (teachers[0].status === 'blocked') {
      return res.status(403).json({ success: false, message: 'Cannot update performance of a blocked teacher.' });
    }
    
    const sql = `
      INSERT INTO performance_scores (teacher_id, rating, remarks)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
      rating = VALUES(rating),
      remarks = VALUES(remarks)
    `;
    await pool.execute(sql, [id, rating, remarks || '']);
    return res.status(200).json({ success: true, message: 'Performance updated.', data: { rating, remarks } });
  } catch (error) {
    console.error('updatePerformance Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update performance.' });
  }
};
