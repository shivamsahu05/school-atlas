const mysql = require('mysql2/promise');

async function seed() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'atlas_sams_db'
  });

  try {
    // 1. Create table
    console.log("Creating micro_schedule table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS micro_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        class_number VARCHAR(20) NOT NULL,
        section VARCHAR(10) NOT NULL,
        subject_id INT NOT NULL,
        month VARCHAR(50) NOT NULL,
        week VARCHAR(100) NOT NULL,
        topic TEXT,
        periods_planned INT DEFAULT 0,
        periods_completed INT DEFAULT 0,
        learning_status VARCHAR(50) DEFAULT 'Pending',
        homework TEXT,
        students_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY \`unique_plan\` (\`teacher_id\`, \`class_number\`, \`section\`, \`subject_id\`, \`month\`, \`week\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Insert test data
    console.log("Inserting test data...");
    await connection.execute(`
      INSERT INTO micro_schedule (
        teacher_id, class_number, section, subject_id, month, week, topic, periods_planned, learning_status
      ) VALUES (
        7, '1', 'section A', 1, 'April', 'Week 1', 'Introduction to Science and Nature', 5, 'Pending'
      ) ON DUPLICATE KEY UPDATE topic = VALUES(topic);
    `);

    console.log("Seed successful!");
  } catch (err) {
    console.error("Seed failed:", err.message);
  } finally {
    await connection.end();
  }
}

seed();
