const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'atlas_sams_db'
  });

  try {
    const [rows] = await connection.execute('SELECT id, name, email, role, status FROM users LIMIT 10');
    console.log('--- USERS IN DATABASE ---');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

main();
