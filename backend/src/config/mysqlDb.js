// src/config/mysqlDb.js
// Raw SQL pool — used only where Prisma ORM is insufficient.
// Prisma (db.js) is the PRIMARY database layer.

const mysql = require('mysql2');

// Singleton guard — prevent duplicate pools on hot reload
if (globalThis.__mysqlPool) {
  module.exports = globalThis.__mysqlPool.promise();
  return;
}

let dbConfig = {
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Fallback to DATABASE_URL parsing if DB_HOST is not provided
if (!dbConfig.host && process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    dbConfig.host = parsed.hostname;
    dbConfig.user = parsed.username;
    dbConfig.password = decodeURIComponent(parsed.password);
    dbConfig.database = parsed.pathname.replace(/^\//, '');
  } catch (error) {
    console.error('Failed to parse DATABASE_URL for MySQL pool');
  }
}

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.MYSQL_POOL_LIMIT || '3', 10),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Cache globally to prevent duplicate pools on hot reload
globalThis.__mysqlPool = pool;

// Export promise-based pool (used everywhere with async/await)
module.exports = pool.promise();
