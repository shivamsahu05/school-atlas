const pool = require('../src/config/mysqlDb');

async function seed() {
  try {
    console.log('--- SEEDING LO SYSTEM ---');

    // 1. Learning Outcomes
    const outcomes = [
      ['Algebraic Mastery', 'Student can solve quadratic equations independently'],
      ['Scientific Inquiry', 'Student can perform basic titration experiment'],
      ['Literary Analysis', 'Student identifies themes in contemporary poetry'],
      ['Historical Context', 'Student explains causes of World War II'],
      ['Computational Logic', 'Student writes a basic loop in JavaScript']
    ];
    for (const [title, desc] of outcomes) {
      await pool.query('INSERT INTO learning_outcomes (topic) VALUES (?)', [title]);
    }
    console.log('✅ Learning Outcomes seeded');

    // 2. Mapping Teachers to Classes (teacher_class_assignments)
    // Map Teacher 1 to Class 13, Teacher 3 to Class 12, etc.
    const mappings = [
      [1, 13, 1], // teacher_id, class_id, section_id (1 is usually A)
      [3, 12, 1],
      [4, 11, 1],
      [5, 13, 2]  // section B
    ];
    for (const [t, c, s] of mappings) {
      await pool.query('INSERT INTO teacher_class_assignments (teacher_id, class_id, section_id, academic_year) VALUES (?, ?, ?, "2026-27")', [t, c, s]);
    }
    console.log('✅ Teacher-Class Assignments seeded');

    // 3. Mapping Subjects to Classes (acad_class_subjects)
    // Map Subject 6 to Class 13, Subject 7 to Class 12, etc.
    const classSubs = [
      [13, 6], [13, 5],
      [12, 7], [12, 4],
      [11, 3]
    ];
    for (const [c, s] of classSubs) {
        // Check if acad_class_subjects exists
        try {
            await pool.query('INSERT INTO acad_class_subjects (class_id, subject_id) VALUES (?, ?)', [c, s]);
        } catch (e) { console.log('Skipping acad_class_subjects insert:', e.message); }
    }
    console.log('✅ Class-Subject mappings seeded');

    // 4. Mapping Teachers to Subjects (teacher_subjects)
    const teachSubs = [
        [1, 6, 13], [1, 5, 13],
        [3, 7, 12], [3, 4, 12],
        [4, 3, 11]
    ];
    for (const [t, s, c] of teachSubs) {
        await pool.query('INSERT INTO teacher_subjects (teacher_id, subject_id, class_id) VALUES (?, ?, ?)', [t, s, c]);
    }
    console.log('✅ Teacher-Subject mappings seeded');

    console.log('--- SEEDING COMPLETE ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error);
    process.exit(1);
  }
}

seed();
