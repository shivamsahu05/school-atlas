const pool = require('../src/config/mysqlDb');

const createTableSql = `
CREATE TABLE IF NOT EXISTS \`syllabus_plan\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`class\` varchar(50) NOT NULL,
  \`section\` varchar(10) NOT NULL,
  \`subject\` varchar(100) NOT NULL,
  \`month\` varchar(20) NOT NULL,
  \`week\` varchar(50) NOT NULL,
  \`start_date\` date NOT NULL,
  \`end_date\` date NOT NULL,
  \`periods\` int(11) DEFAULT 0,
  \`chapter_topic\` varchar(255) NOT NULL,
  \`learning_outcome\` text DEFAULT NULL,
  \`remarks\` text DEFAULT NULL,
  \`status\` varchar(20) DEFAULT 'pending',
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_syllabus_plan_query\` (\`class\`, \`section\`, \`subject\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function run() {
  try {
    console.log('Creating table syllabus_plan...');
    await pool.execute(createTableSql);
    console.log('Table created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating table:', err);
    process.exit(1);
  }
}

run();
