// src/controllers/studentsController.js
const pool = require('../config/mysqlDb');
const XLSX = require('xlsx');

// ─── Helper: Format Response ──────────────────────────────────────────────────
const sendResponse = (res, success, data, message = '', status = 200) => {
  return res.status(status).json({ success, data, message });
};

// ─── Helper: Parse Date ────────────────────────────────────────────────────────
const parseExcelDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];
  const s = String(dateStr).trim();
  if (s.includes('/')) {
    const [d, m, y] = s.split('/');
    if (d && m && y) return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts[0].length === 4) return s;
    if (parts[2].length === 4) {
      const [d, m, y] = parts;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return s;
};

/**
 * GET /api/students
 * Fetches all students with class information.
 */
exports.getStudents = async (req, res) => {
  const { class_id, section_id } = req.query;
  try {
    let sql = `
      SELECT 
        s.*,
        ac.name as class_name,
        asec.name as section_name
      FROM students s
      LEFT JOIN academic_classes ac ON s.class_id = ac.id
      LEFT JOIN acad_sections asec ON s.section_id = asec.id
      WHERE 1=1
    `;
    const params = [];
    
    if (class_id && class_id !== 'All') {
      sql += ' AND s.class_id = ?';
      params.push(Number(class_id));
    }
    if (section_id) {
      sql += ' AND s.section_id = ?';
      params.push(Number(section_id));
    }

    sql += ' ORDER BY ac.name ASC, s.roll_no ASC';

    const [rows] = await pool.execute(sql, params);
    
    const formattedRows = rows.map(row => ({
      ...row,
      class: {
        class_name: row.class_name,
        section: row.section_name
      }
    }));

    return res.status(200).json({
      success: true,
      data: formattedRows
    });
  } catch (error) {
    console.error('getStudents Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch students.', data: [] });
  }
};

/**
 * GET /api/students/:id
 */
exports.getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT s.*, ac.name as class_name, asec.name as section_name
      FROM students s
      LEFT JOIN academic_classes ac ON s.class_id = ac.id
      LEFT JOIN acad_sections asec ON s.section_id = asec.id
      WHERE s.id = ?
    `, [id]);

    if (rows.length === 0) return sendResponse(res, false, [], 'Student not found.', 404);
    
    const student = {
      ...rows[0],
      class: {
        class_name: rows[0].class_name,
        section: rows[0].section_name
      }
    };

    return sendResponse(res, true, [student]);
  } catch (error) {
    return sendResponse(res, false, [], 'Error fetching student.', 500);
  }
};

/**
 * POST /api/students
 */
exports.createStudent = async (req, res) => {
  try {
    const { 
      name, roll_no, email, class_id, section_id, gender, dob,
      father_name, mother_name, mobile, optional_mobile,
      address, remarks, status 
    } = req.body;

    if (!name || !father_name || !mobile || !class_id) {
      return res.status(422).json({ success: false, message: "Missing required fields" });
    }

    const safeValue = (val) => (val === undefined || val === '') ? null : val;
    let formattedDob = parseExcelDate(dob);

    const sql = `
      INSERT INTO students (
        name, roll_no, email, class_id, section_id, gender, dob, 
        father_name, mother_name, mobile, optional_mobile, 
        address, remarks, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(sql, [
      String(name).trim(),
      roll_no || `R-${Math.floor(1000 + Math.random() * 9000)}`,
      safeValue(email),
      Number(class_id),
      safeValue(section_id) ? Number(section_id) : null,
      safeValue(gender),
      formattedDob,
      String(father_name).trim(),
      safeValue(mother_name),
      String(mobile).trim(),
      safeValue(optional_mobile),
      safeValue(address),
      safeValue(remarks),
      safeValue(status) || 'Active'
    ]);

    return sendResponse(res, true, [{ id: result.insertId }], 'Student created.', 201);
  } catch (error) {
    return res.status(500).json({ success: false, data: [], message: "Registration failed", error: error.message });
  }
};

/**
 * PUT /api/students/:id
 */
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, father_name, mother_name, mobile, optional_mobile,
      class_id, section_id, dob, gender, address, remarks, status 
    } = req.body;

    if (!name || !father_name || !mobile || !class_id) {
      return sendResponse(res, false, [], 'Required fields missing.', 400);
    }

    let formattedDob = parseExcelDate(dob);

    const sql = `
      UPDATE students 
      SET name=?, father_name=?, mother_name=?, mobile=?, optional_mobile=?, 
          class_id=?, section_id=?, dob=?, gender=?, address=?, remarks=?, 
          status=?, updated_at=NOW()
      WHERE id=?
    `;

    const values = [
      name || null, father_name || null, mother_name || null, mobile || null, optional_mobile || null,
      class_id ? Number(class_id) : null, section_id ? Number(section_id) : null, formattedDob, gender || null, address || null,
      remarks || null, status || 'Active', id
    ];

    const [result] = await pool.execute(sql, values);

    if (result.affectedRows === 0) {
      return sendResponse(res, false, [], 'Student not found.', 404);
    }

    return res.status(200).json({ success: true, data: [], message: "Student updated successfully" });
  } catch (error) {
    return sendResponse(res, false, [], 'Update failed: ' + error.message, 500);
  }
};

/**
 * DELETE /api/students/:id
 */
exports.deleteStudent = async (req, res) => {
  try {
    await pool.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
    return sendResponse(res, true, [], 'Student deleted.');
  } catch (error) {
    return sendResponse(res, false, [], 'Delete failed.', 500);
  }
};

/**
 * POST /api/students/bulk-upload
 */
exports.bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, data: [], message: 'No file uploaded.' });
    
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const results = { totalRows: rows.length, inserted: 0, failed: 0, errors: [] };

    for (const [index, row] of rows.entries()) {
      try {
        const name = row['Full Name'];
        const mobile = row['Primary Mobile'];
        const classNameRaw = row['Class Name']; 
        
        if (!name || !mobile || !classNameRaw) {
          results.failed++;
          results.errors.push(`Row ${index + 2}: Missing mandatory fields.`);
          continue;
        }

        const [cName, cSection] = classNameRaw.includes('-') ? classNameRaw.split('-') : [classNameRaw, ''];
        const [classes] = await pool.execute(
          'SELECT id FROM classes WHERE class_name = ? AND (section = ? OR section = "") LIMIT 1',
          [cName.trim(), (cSection || '').trim()]
        );
        
        if (classes.length === 0) {
          results.failed++;
          results.errors.push(`Row ${index + 2}: Class not found.`);
          continue;
        }

        const sql = `
          INSERT INTO students (
            name, roll_no, class_id, father_name, mother_name, mobile, gender, dob, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
        `;

        await pool.execute(sql, [
          name, row['Roll No'] || `R-${Math.floor(1000 + Math.random() * 9000)}`,
          classes[0].id, row['Father Name'] || '', row['Mother Name'] || '', mobile, 
          row['Gender'] || 'Male', parseExcelDate(row['DOB'])
        ]);

        results.inserted++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${index + 2}: ${err.message}`);
      }
    }

    return res.status(200).json({ success: true, message: 'Bulk processing finished.', data: [results] });
  } catch (error) {
    return res.status(500).json({ success: false, data: [], message: 'Critical failure during upload.' });
  }
};
