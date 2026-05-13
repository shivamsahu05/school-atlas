// src/config/mysqlDb.js
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * PRODUCTION-READY MYSQL POOL
 * Correctly parses DATABASE_URL into a config object so that
 * connectionLimit is ACTUALLY applied (URL query params are ignored by mysql2).
 */

function parseDbUrl(url) {
  try {
    // Strip prisma-specific params (connection_limit, pool_timeout)
    const cleanUrl = url.split('?')[0];
    const u = new URL(cleanUrl);
    return {
      host:     u.hostname,
      port:     parseInt(u.port) || 3306,
      user:     decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
    };
  } catch (e) {
    console.error('❌ [DB]: Failed to parse DATABASE_URL:', e.message);
    return null;
  }
}

let pool;

try {
  let baseConfig;

  if (process.env.DATABASE_URL) {
    console.log('📡 [DB]: Parsing DATABASE_URL for pool config...');
    baseConfig = parseDbUrl(process.env.DATABASE_URL);
    if (!baseConfig) throw new Error('Invalid DATABASE_URL format');
  } else {
    console.log('📡 [DB]: Using individual DB_* environment variables');
    baseConfig = {
      host:     process.env.DB_HOST     || '127.0.0.1',
      port:     parseInt(process.env.DB_PORT) || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
    };
  }

  // Build pool with EXPLICIT connection limit (not URL params which mysql2 ignores)
  const poolConfig = {
    ...baseConfig,
    waitForConnections:    true,
    connectionLimit:       5,    // Hard cap — prevents max_connections_per_hour
    queueLimit:            0,
    enableKeepAlive:       true,
    keepAliveInitialDelay: 10000,
    connectTimeout:        15000,
  };

  console.log(`📡 [DB]: Connecting to ${poolConfig.host}:${poolConfig.port}/${poolConfig.database} (limit=5)`);
  pool = mysql.createPool(poolConfig);

  // Health Check
  pool.getConnection().then(conn => {
    console.log('✅ [DB]: MySQL Pool initialized and connected');
    conn.release();
  }).catch(err => {
    console.error('❌ [DB]: MySQL Initial Connection Failed:', err.message);
    // Don't exit — let requests fail gracefully instead of crashing server
  });

} catch (error) {
  console.error('❌ [DB]: MySQL Initialization Error:', error.message);
  process.exit(1);
}

module.exports = pool;
