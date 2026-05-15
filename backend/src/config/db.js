// src/config/db.js
// Hardened Prisma Singleton — ONE instance per runtime, always.
// Works correctly in: Local Dev, Render (container), Vercel (serverless), hot reload.

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ [Prisma]: DATABASE_URL is not defined. Check your .env file.');
  process.exit(1); // Hard fail — app cannot run without DB
}

const { PrismaClient } = require('@prisma/client');

// globalThis caching prevents multiple instances during:
// - Next.js / nodemon hot reloads (dev)
// - Serverless cold starts where module cache may be bypassed
// NOTE: This must be ALWAYS enabled, not just in dev.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'production'
    ? ['error']           // Production: only errors
    : ['error', 'warn'],  // Dev: errors + warnings
  // NOTE: connection_limit is set via DATABASE_URL query param in .env
  // Example: DATABASE_URL="mysql://...?connection_limit=3"
});

// Always cache — prevents new instance on hot reload (dev) and module re-eval (serverless)
globalForPrisma.__prisma = prisma;

if (process.env.NODE_ENV !== 'production') {
  console.log('✅ [Prisma]: Singleton initialized (dev mode)');
}

module.exports = prisma;
