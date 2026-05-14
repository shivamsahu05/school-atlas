// src/config/db.js
// Singleton Prisma client – reuse across all modules

// Ensure environment variables are loaded (crucial for local/dev/scripts)
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ [Prisma]: DATABASE_URL is not defined in environment.');
}

let prisma = null;

try {
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = globalThis;

  prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: ['error', 'warn'],
    });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  console.log('✅ [Prisma]: Client initialized');
} catch (err) {
  console.warn('⚠️ [Prisma]: Client init failed (non-fatal, mysql2 pool is primary):', err.message);
  // Return a proxy that throws a clear error when any method is called
  // Proxy handler for nested property access when Prisma fails to init
  const createProxy = (path = '') => {
    return new Proxy(() => {}, {
      get: (target, prop) => {
        if (prop === 'then' || prop === 'constructor') return undefined;
        return createProxy(path ? `${path}.${String(prop)}` : String(prop));
      },
      apply: (target, thisArg, args) => {
        throw new Error(`Prisma not available (DATABASE_URL missing?). Fallback to mysql2 pool. Attempted: ${path}`);
      }
    });
  };
  prisma = createProxy();
}

module.exports = prisma;
