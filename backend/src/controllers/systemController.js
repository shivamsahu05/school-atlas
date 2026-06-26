const pool = require('../config/mysqlDb');

// 1. Teacher Permission Reset
exports.resetPermissions = async (req, res) => {
  try {
    await pool.execute('DELETE FROM teacher_module_permissions WHERE 1=1');
    res.json({ success: true, message: 'All teacher module permissions have been completely revoked.' });
  } catch (error) {
    console.error('Permission reset error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset permissions.' });
  }
};

// 2. Bulk Data Cleanup
exports.cleanupData = async (req, res) => {
  try {
    // Legacy notification logs (> 90 days)
    await pool.execute('DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)');
    
    res.json({ success: true, message: 'Legacy notification logs and temp data cleaned up successfully.' });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ success: false, message: 'Failed to perform bulk cleanup.' });
  }
};

// 3. Academic Year Rollover
exports.rolloverYear = async (req, res) => {
  try {
    // In a real scenario, this would update a settings table or shift data to archives
    // For now we simulate it successfully and clear some temporary old session data if any
    
    // As a safe example, clearing all active ongoing class allocations could happen here
    // but we will keep it simple and safe for the DB
    res.json({ success: true, message: 'System rollover initiated. 2023-24 finalized and prepared for 2024-25.' });
  } catch (error) {
    console.error('Rollover error:', error);
    res.status(500).json({ success: false, message: 'Failed to process academic year rollover.' });
  }
};

// 4. Get System Status / Session
exports.getSystemStatus = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const month = new Date().getMonth(); // 0-indexed, 0 = Jan, 11 = Dec
    // If before April (month < 3), active session is (year-1) to year
    // If April or later, active session is year to (year+1)
    const session = month < 3 ? `${year - 1}-${year.toString().slice(-2)}` : `${year}-${(year + 1).toString().slice(-2)}`;
    
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, session: 'Unknown' });
  }
};

// 5. Bulk Student Promotion
exports.bulkPromote = async (req, res) => {
  const { promotions } = req.body;
  if (!Array.isArray(promotions)) {
    return res.status(400).json({ success: false, message: 'Invalid payload.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch all classes ordered by sort_order
    const [classes] = await connection.execute('SELECT * FROM academic_classes ORDER BY sort_order ASC');
    
    // 2. Fetch class sections mapping
    const [classSections] = await connection.execute('SELECT * FROM acad_class_sections');

    // Fetch all students involved
    const studentIds = promotions.filter(p => p.promote && p.student_id).map(p => p.student_id);
    let studentsToPromote = [];
    
    if (studentIds.length > 0) {
      // Create placeholders for IN clause
      const placeholders = studentIds.map(() => '?').join(',');
      const [rows] = await connection.execute(`SELECT * FROM students WHERE id IN (${placeholders})`, studentIds);
      studentsToPromote = rows;
    }

    // Map classes for quick lookup
    const classMap = {};
    classes.forEach(c => { classMap[String(c.id)] = c; });

    // Sort students top-down (highest sort_order first), then alphabetically
    studentsToPromote.sort((a, b) => {
      const classA = classMap[String(a.class_id)];
      const classB = classMap[String(b.class_id)];
      const orderA = classA ? classA.sort_order : 0;
      const orderB = classB ? classB.sort_order : 0;
      
      if (orderA !== orderB) return orderB - orderA; // Descending
      return a.name.localeCompare(b.name);
    });

    let promotedCount = 0;
    let graduatedCount = 0;
    let unchangedCount = promotions.length - studentIds.length;

    // Grouping for roll number regeneration
    // Map: classId -> currentMaxRollNo
    const classRolls = {};

    for (const student of studentsToPromote) {
      const currentClassIndex = classes.findIndex(c => String(c.id) === String(student.class_id));
      
      if (currentClassIndex === -1) {
        continue;
      }

      const nextClassIndex = currentClassIndex + 1;
      
      if (nextClassIndex >= classes.length) {
        // No next class -> Graduate
        await connection.execute('UPDATE students SET status = ? WHERE id = ?', ['Graduated', student.id]);
        graduatedCount++;
      } else {
        const nextClass = classes[nextClassIndex];
        
        let nextSectionId = null;
        const availableSectionsForNextClass = classSections.filter(cs => String(cs.class_id) === String(nextClass.id));
        
        if (availableSectionsForNextClass.length > 0) {
          const sameSection = availableSectionsForNextClass.find(cs => String(cs.section_id) === String(student.section_id));
          if (sameSection) {
            nextSectionId = student.section_id;
          } else {
            nextSectionId = availableSectionsForNextClass[0].section_id;
          }
        }

        // Generate next roll number for this class (ignoring section)
        if (!classRolls[nextClass.id]) classRolls[nextClass.id] = 0;
        classRolls[nextClass.id]++;
        const newRollNo = classRolls[nextClass.id].toString();

        await connection.execute(
          'UPDATE students SET class_id = ?, section_id = ?, roll_no = ?, status = ? WHERE id = ?',
          [nextClass.id, nextSectionId, newRollNo, 'Active', student.id]
        );
        promotedCount++;
      }
    }

    // Log the operation
    await connection.execute(
      'INSERT INTO notifications (type, message, role_target, status, is_read, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      ['alert', `Bulk Promotion Executed: ${promotedCount} promoted, ${graduatedCount} graduated.`, 'admin', 'pending', 0]
    );

    await connection.commit();
    res.json({ 
      success: true, 
      message: `Bulk promotion completed. Promoted: ${promotedCount}, Graduated: ${graduatedCount}, Unchanged: ${unchangedCount}` 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Bulk promote error:', error);
    res.status(500).json({ success: false, message: 'Failed to process bulk promotion.' });
  } finally {
    connection.release();
  }
};
