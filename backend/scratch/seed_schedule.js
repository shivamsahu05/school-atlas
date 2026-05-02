const pool = require('../src/config/mysqlDb');

async function run() {
  try {
    console.log('--- SEEDING MICRO SCHEDULE DATA ---');

    // 1. Find a teacher
    const [teachers] = await pool.query('SELECT t.id, u.name FROM teachers t JOIN users u ON u.id = t.user_id LIMIT 1');
    if (teachers.length === 0) {
      console.log('No teachers found to seed.');
      process.exit(0);
    }
    const teacherId = teachers[0].id;
    const teacherName = teachers[0].name;
    console.log(`Found teacher: ${teacherName} (ID: ${teacherId})`);

    // 2. Grant permission for Micro Schedule (Module ID 5)
    // Find a valid class
    const [classes] = await pool.query('SELECT id FROM classes LIMIT 1');
    if (classes.length === 0) {
      console.log('No classes found to grant permission.');
      process.exit(0);
    }
    const classId = classes[0].id;

    await pool.query(`
      INSERT INTO teacher_module_permissions (teacher_id, class_id, module_id, start_date, end_date, status)
      VALUES (?, ?, 5, '2026-01-01', '2026-12-31', 'ACTIVE')
      ON DUPLICATE KEY UPDATE status = 'ACTIVE', end_date = '2026-12-31'
    `, [teacherId, classId]);
    console.log('✅ Permission granted');

    // 3. Ensure some subjects and time slots exist
    const [subjects] = await pool.query('SELECT id FROM subjects LIMIT 3');
    const [timeSlots] = await pool.query('SELECT id FROM time_slots LIMIT 5');

    if (subjects.length > 0 && timeSlots.length > 0) {
      // 4. Create some timetable entries for this teacher
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (const day of days) {
        // Add 2 periods per day
        for (let i = 0; i < 2; i++) {
          const subId = subjects[i % subjects.length].id;
          const tsId = timeSlots[i % timeSlots.length].id;
          
          await pool.query(`
            INSERT INTO teacher_timetable (teacher_id, class_number, section, subject_id, time_slot_id, day_of_week, topic, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE topic = VALUES(topic)
          `, [
            teacherId, 
            '8', 
            'A', 
            subId, 
            tsId, 
            day, 
            `Chapter ${i+1}: Introduction to ${day}`, 
            'Pending'
          ]);
        }
      }
      console.log('✅ Timetable entries seeded');
    } else {
      console.log('Missing subjects or time slots to seed timetable.');
    }

    console.log('--- SEEDING COMPLETE ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error);
    process.exit(1);
  }
}

run();
