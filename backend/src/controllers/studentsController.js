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
    const parts = s.split('/');
    if (parts.length === 3) {
      // Assuming DD/MM/YYYY
      if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return s; // YYYY-MM-DD
      if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  if (!isNaN(Number(s)) && Number(s) > 10000) {
    const parsed = new Date(Math.round((Number(s) - 25569) * 86400 * 1000));
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }
  
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];

  return null;
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
        asec.name as section_name,
        s.house
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
      name, roll_no, email, class_id, section_id, gender, dob, house,
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
        house, address, remarks, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      safeValue(house) || 'Not Assigned',
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
      class_id, section_id, dob, gender, house, address, remarks, status 
    } = req.body;

    if (!name || !father_name || !mobile || !class_id) {
      return sendResponse(res, false, [], 'Required fields missing.', 400);
    }

    let formattedDob = parseExcelDate(dob);

    const sql = `
      UPDATE students 
      SET name=?, father_name=?, mother_name=?, mobile=?, optional_mobile=?, 
          class_id=?, section_id=?, dob=?, gender=?, house=?, address=?, remarks=?, 
          status=?, updated_at=NOW()
      WHERE id=?
    `;

    const values = [
      name || null, father_name || null, mother_name || null, mobile || null, optional_mobile || null,
      class_id ? Number(class_id) : null, section_id ? Number(section_id) : null, formattedDob, gender || null, 
      house || 'Not Assigned', address || null,
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
 * POST /api/students/:id/lifecycle
 */
exports.handleLifecycle = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['promote', 'fail', 'graduate'].includes(action)) {
      return res.status(400).json({ success: false, data: [], message: 'Invalid lifecycle action. Allowed: promote, fail, graduate.' });
    }

    const [students] = await pool.execute('SELECT name, class_id, section_id FROM students WHERE id = ?', [id]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, data: [], message: 'Student not found.' });
    }
    const student = students[0];

    if (action === 'graduate') {
      await pool.execute('UPDATE students SET status = "Graduated", updated_at = NOW() WHERE id = ?', [id]);
      return res.status(200).json({ success: true, data: [], message: 'Student graduated successfully.' });
    }

    if (action === 'fail') {
      await pool.execute('UPDATE students SET status = "Failed", updated_at = NOW() WHERE id = ?', [id]);
      return res.status(200).json({ success: true, data: [], message: 'Student marked as Failed/Repeating.' });
    }

    if (action === 'promote') {
      const { target_section_id } = req.body;

      const [currentClass] = await pool.execute('SELECT sort_order, id, class_number FROM academic_classes WHERE id = ?', [student.class_id]);
      if (currentClass.length === 0) {
        return res.status(404).json({ success: false, data: [], message: 'Current class not found.' });
      }

      let nextClass = [];
      const classNum = parseInt(currentClass[0].class_number, 10);

      // Prefer numerical sequencing if class_number exists and is valid
      if (!isNaN(classNum) && classNum > 0) {
        [nextClass] = await pool.execute(
          'SELECT id, name FROM academic_classes WHERE CAST(class_number AS UNSIGNED) > ? ORDER BY CAST(class_number AS UNSIGNED) ASC LIMIT 1',
          [classNum]
        );
      } else {
        // Try to find the next class by sequence order
        const sortOrder = currentClass[0].sort_order;
        [nextClass] = await pool.execute(
          'SELECT id, name FROM academic_classes WHERE sort_order > ? ORDER BY sort_order ASC LIMIT 1', 
          [sortOrder]
        );

        // Fallback: if no sort_order exists, try id + 1 safely
        if (nextClass.length === 0) {
          [nextClass] = await pool.execute(
            'SELECT id, name FROM academic_classes WHERE id > ? ORDER BY id ASC LIMIT 1', 
            [student.class_id]
          );
        }
      }

      if (nextClass.length === 0) {
        return res.status(200).json({ 
          success: true, 
          needs_graduation_confirm: true, 
          message: 'No higher class found. This student will be marked as Graduated. Do you want to continue?' 
        });
      }

      const nextClassId = nextClass[0].id;
      const nextClassName = nextClass[0].name;

      // Fetch all sections mapped to this target class
      const [sections] = await pool.execute(`
        SELECT s.id, s.name 
        FROM acad_sections s
        JOIN acad_class_sections cs ON s.id = cs.section_id
        WHERE cs.class_id = ?
      `, [nextClassId]);

      if (sections.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: `The target class "${nextClassName}" has no sections defined. Please create a section first.` 
        });
      }

      // If multiple sections exist and none selected, return list for UI popup
      if (sections.length > 1 && !target_section_id) {
        return res.status(200).json({
          success: true,
          needs_section: true,
          student_name: student.name || 'Student',
          next_class_id: nextClassId,
          next_class_name: nextClassName,
          sections: sections,
          message: 'Target class has multiple sections. Please select one.'
        });
      }

      // Use target_section_id if provided, otherwise auto-assign if only 1 section exists
      let finalSectionId = target_section_id;
      
      if (target_section_id) {
        // Strict Validation: Ensure the selected section belongs to the CALCULATED next class
        const isValid = sections.some(s => s.id === Number(target_section_id));
        if (!isValid) {
          return res.status(400).json({ success: false, message: `Invalid section selection. The chosen section does not belong to ${nextClassName}.` });
        }
      } else {
        finalSectionId = sections[0].id;
      }

      // Identify max roll number in the target class + section
      const [maxRollResult] = await pool.execute(
        'SELECT MAX(CAST(roll_no AS UNSIGNED)) as maxRoll FROM students WHERE class_id = ? AND section_id = ?', 
        [nextClassId, finalSectionId]
      );
      
      let newRollNo = 1;
      if (maxRollResult[0].maxRoll && !isNaN(parseInt(maxRollResult[0].maxRoll))) {
        newRollNo = parseInt(maxRollResult[0].maxRoll, 10) + 1;
      }

      // Promote to next class, reset section_id safely, assign new roll_no
      await pool.execute(
        'UPDATE students SET class_id = ?, section_id = ?, roll_no = ?, status = "Active", updated_at = NOW() WHERE id = ?', 
        [nextClassId, finalSectionId, String(newRollNo), id]
      );
      return res.status(200).json({ 
        success: true, 
        data: [], 
        message: `Student promoted to ${nextClassName} successfully with Roll No ${newRollNo}.` 
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, data: [], message: 'Lifecycle update failed: ' + error.message });
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
    const rawRows = XLSX.utils.sheet_to_json(sheet);

    const results = { total: rawRows.length, success: 0, failed: 0, errors: [] };

    const normalize = (str) => {
      if (!str || typeof str !== 'string') return '';
      return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    };

    const fieldMapping = {
      name: ['name', 'studentname', 'fullname'],
      classRaw: ['class', 'classname', 'cls'],
      sec: ['section', 'sec'],
      roll_no: ['rollno', 'roll', 'rollnumber', 'rol'],
      father_name: ['fathername', 'father'],
      mother_name: ['mothername', 'mother'],
      mobile: ['mobile1', 'mobile', 'primarymobile', 'phone'],
      optional_mobile: ['mobile2', 'optionalmobile', 'altmobile'],
      house: ['house'],
      address: ['address', 'adress'],
      gender: ['gender', 'gen'],
      remarks: ['remarks'],
      dob: ['dob', 'dateofbirth']
    };

    const insertSql = `
      INSERT INTO students (
        name, roll_no, class_id, section_id, father_name, mother_name, 
        mobile, optional_mobile, address, gender, dob, house, remarks, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    `;

    for (const [index, rawRow] of rawRows.entries()) {
      try {
        const row = {};
        for (let key in rawRow) {
          const normKey = normalize(key);
          for (let field in fieldMapping) {
            if (fieldMapping[field].includes(normKey)) {
              row[field] = rawRow[key];
              break;
            }
          }
        }

        const name = row.name;
        const mobile = row.mobile;
        let cNameRaw = row.classRaw;
        let cSecRaw = row.sec;

        if (!name || !mobile || !cNameRaw) {
          results.failed++;
          results.errors.push(`Row ${index + 2}: Missing mandatory fields (Name, Mobile 1, or Class).`);
          continue;
        }

        let cName = String(cNameRaw).trim();
        let cSection = cSecRaw ? String(cSecRaw).trim() : '';

        // Normalize Class and Section
        cName = cName.replace(/^(class|cls)\s*/i, '').trim();
        cSection = cSection.replace(/^(section|sec|-)\s*/i, '').trim();

        if (cName.includes('-') && !cSection) {
          const parts = cName.split('-');
          cName = parts[0].trim();
          cSection = parts[1].trim();
        }

        const [classes] = await pool.execute(
          'SELECT id FROM academic_classes WHERE name = ? OR class_number = ? LIMIT 1',
          [cName, cName]
        );
        
        if (classes.length === 0) {
          results.failed++;
          results.errors.push(`Row ${index + 2}: Class '${cName}' not found in database.`);
          continue;
        }

        let sectionId = null;
        if (cSection) {
          const [sections] = await pool.execute(
            'SELECT id FROM acad_sections WHERE name = ? OR code = ? LIMIT 1',
            [cSection, cSection]
          );
          if (sections.length > 0) {
            sectionId = sections[0].id;
          }
        }

        // Generate or validate Roll No
        let finalRollNo = row.roll_no ? String(row.roll_no).trim() : null;
        if (!finalRollNo) {
          const [maxRollResult] = await pool.execute(
            'SELECT MAX(CAST(roll_no AS UNSIGNED)) as maxRoll FROM students WHERE class_id = ?', 
            [classes[0].id]
          );
          let nextRollNo = 1;
          if (maxRollResult[0].maxRoll && !isNaN(parseInt(maxRollResult[0].maxRoll))) {
            nextRollNo = parseInt(maxRollResult[0].maxRoll, 10) + 1;
          }
          finalRollNo = String(nextRollNo);
        }

        // Check if student with same Roll No, Class, and Section already exists
        const [existing] = await pool.execute(
          'SELECT id FROM students WHERE roll_no = ? AND class_id = ? AND (section_id = ? OR (section_id IS NULL AND ? IS NULL)) LIMIT 1',
          [finalRollNo, classes[0].id, sectionId, sectionId]
        );

        if (existing.length > 0) {
          // If exists, update instead of insert (UPSERT behavior)
          const updateSql = `
            UPDATE students SET 
              name=?, section_id=?, father_name=?, mother_name=?, mobile=?, 
              optional_mobile=?, address=?, gender=?, dob=?, house=?, remarks=?, updated_at=NOW()
            WHERE id=?
          `;
          await pool.execute(updateSql, [
            String(name).trim(),
            sectionId,
            row.father_name ? String(row.father_name).trim() : '',
            row.mother_name ? String(row.mother_name).trim() : '',
            String(mobile).trim(),
            row.optional_mobile ? String(row.optional_mobile).trim() : '',
            row.address ? String(row.address).trim() : '',
            row.gender ? String(row.gender).trim() : 'Male',
            row.dob ? parseExcelDate(row.dob) : null,
            row.house || 'Not Assigned',
            row.remarks ? String(row.remarks).trim() : '',
            existing[0].id
          ]);
        } else {
          // Insert new record
          await pool.execute(insertSql, [
            String(name).trim(), 
            finalRollNo,
            classes[0].id, 
            sectionId,
            row.father_name ? String(row.father_name).trim() : '', 
            row.mother_name ? String(row.mother_name).trim() : '', 
            String(mobile).trim(), 
            row.optional_mobile ? String(row.optional_mobile).trim() : '', 
            row.address ? String(row.address).trim() : '',
            row.gender ? String(row.gender).trim() : 'Male', 
            row.dob ? parseExcelDate(row.dob) : null, 
            row.house || 'Not Assigned',
            row.remarks ? String(row.remarks).trim() : ''
          ]);
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${index + 2}: ${err.message}`);
      }
    }

    return res.status(200).json({ success: true, message: 'Bulk processing finished.', data: [results] });
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    return res.status(500).json({ success: false, data: [], message: 'Critical failure during upload.' });
  }
};

/**
 * GET /api/students/template-download
 */
exports.downloadStudentTemplate = async (req, res) => {
  try {
    const data = [
      {
        'Sr No': 1,
        'Class': '1',
        'Sec': 'A',
        'Roll No': '101',
        'Student Name': 'John Doe',
        'Father Name': 'Robert Doe',
        'Mother Name': 'Jane Doe',
        'Gender': 'Male',
        'DOB': '2015-05-15',
        'House': 'INDIRA - BLUE',
        'Address': '123 Street Name, City',
        'Mobile 1': '9876543210',
        'Mobile 2': '9876543211',
        'Remarks': 'Needs school bus'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Template');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Student_Upload_Template.xlsx');
    
    return res.send(buffer);
  } catch (error) {
    console.error('Template Download Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
};

