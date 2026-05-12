// src/config/mysqlDb.js
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * PRODUCTION-READY MYSQL POOL
 * Handles both DATABASE_URL (Prisma style) and individual DB_* variables.
 * SSOT: Centralized connection logic for mysql2.
 */

let pool;

try {
  const dbConfig = {
    host:               process.env.DB_HOST,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    database:           process.env.DB_NAME,
    port:               process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit:    15,
    queueLimit:         0,
    enableKeepAlive:    true,
    keepAliveInitialDelay: 0
  };

  // If DATABASE_URL is present, use it as priority for production compatibility
  if (process.env.DATABASE_URL) {
    console.log('📡 [DB]: Using DATABASE_URL for connection');
    pool = mysql.createPool(process.env.DATABASE_URL + "?waitForConnections=true&connectionLimit=15");
  } else {
    console.log('📡 [DB]: Using individual DB_* environment variables');
    pool = mysql.createPool(dbConfig);
  }

  // Health Check
  pool.getConnection().then(conn => {
    console.log('✅ [DB]: MySQL Pool initialized and connected');
    conn.release();
  }).catch(err => {
    console.error('❌ [DB]: MySQL Initial Connection Failed:', err.message);
  });

} catch (error) {
  console.error('❌ [DB]: MySQL Initialization Error:', error.message);
  process.exit(1); // Critical failure
}

module.exports = pool;
