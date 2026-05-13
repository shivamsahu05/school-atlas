const pool = require('../src/config/mysqlDb');

async function seed() {
  try {
    console.log('--- RE-SEEDING LO SYSTEM ---');

    // 1. Learning Outcomes (topics)
    const outcomes = [
      ['Algebraic Mastery'],
      ['Scientific Inquiry'],
      ['Literary Analysis'],
      ['Historical Context'],
      ['Computational Logic']
    ];
    for (const [topic] of outcomes) {
      // Use student_id 15 as a placeholder for these topics
      await pool.query('INSERT INTO learning_outcomes (topic, student_id, subject_id, teacher_score, principal_score) VALUES (?, 15, 6, 0, 0)', [topic]);
    }
    console.log('✅ Learning Outcomes seeded');

    // 2. Mapping Teachers to Classes
    const mappings = [
      [1, 13, 1], [3, 12, 1], [4, 11, 1], [5, 13, 2]
    ];
    for (const [t, c, s] of mappings) {
      await pool.query('INSERT IGNORE INTO teacher_class_assignments (teacher_id, class_id, section_id, academic_year) VALUES (?, ?, ?, "2026-27")', [t, c, s]);
    }
    console.log('✅ Teacher-Class Assignments seeded');

    // 3. Mapping Subjects to Classes
    const classSubs = [
      [13, 6], [13, 5], [12, 7], [12, 4], [11, 3]
    ];
    for (const [c, s] of classSubs) {
        await pool.query('INSERT IGNORE INTO acad_class_subjects (class_id, subject_id) VALUES (?, ?)', [c, s]);
    }
    console.log('✅ Class-Subject mappings seeded');

    // 4. Mapping Teachers to Subjects
    const teachSubs = [
        [1, 6, 13], [1, 5, 13], [3, 7, 12], [3, 4, 12], [4, 3, 11]
    ];
    for (const [t, s, c] of teachSubs) {
        await pool.query('INSERT IGNORE INTO teacher_subjects (teacher_id, subject_id, class_id) VALUES (?, ?, ?)', [t, s, c]);
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
