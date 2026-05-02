// src/config/mysqlDb.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool to MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'atlas_sams_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected successfully via mysql2');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
  }
})();

module.exports = pool;
