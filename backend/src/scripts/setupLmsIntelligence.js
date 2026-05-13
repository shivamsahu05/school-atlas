const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function createNotificationsTable() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'atlas_sams_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('--- CREATING NOTIFICATIONS TABLE ---');
    
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`user_id\` int(11) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`message\` text NOT NULL,
        \`type\` enum('HIGH', 'MEDIUM', 'LOW') DEFAULT 'LOW',
        \`status\` enum('unread', 'read') DEFAULT 'unread',
        \`link\` varchar(255) DEFAULT NULL,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS \`micro_schedule_student_status\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`micro_schedule_id\` int(11) NOT NULL,
        \`student_id\` int(11) NOT NULL,
        \`homework_completed\` boolean DEFAULT false,
        \`notebook_completed\` boolean DEFAULT false,
        \`learning_status\` varchar(50) DEFAULT 'Pending',
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`unique_ms_student\` (\`micro_schedule_id\`, \`student_id\`),
        FOREIGN KEY (\`micro_schedule_id\`) REFERENCES \`micro_schedule\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Tables created/verified successfully.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createNotificationsTable();
