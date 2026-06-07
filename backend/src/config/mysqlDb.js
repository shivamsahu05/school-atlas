// src/config/mysqlDb.js
// Raw SQL pool — used only where Prisma ORM is insufficient.
// Prisma (db.js) is the PRIMARY database layer.

const mysql = require('mysql2');

// Singleton guard — prevent duplicate pools on hot reload
if (globalThis.__mysqlPool) {
  module.exports = globalThis.__mysqlPool.promise();
  return;
}

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: parseInt(process.env.MYSQL_POOL_LIMIT || '3', 10),
});

// Cache globally to prevent duplicate pools on hot reload
globalThis.__mysqlPool = pool;

// Export promise-based pool (used everywhere with async/await)
module.exports = pool.promise();
