// src/config/db.js
// Singleton Prisma client – reuse across all modules

const { PrismaClient } = require('@prisma/client')

const globalForPrisma = globalThis

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

module.exports = prisma
