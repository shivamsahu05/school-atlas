// src/middleware/errorHandler.js
const { sendError } = require('../utils/response')

/**
 * Global Express error handler.
 * Must have 4 parameters to be recognised by Express.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err)

  // Prisma known request errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return sendError(res, `A record with this ${err.meta?.target?.join(', ')} already exists.`, 409)
      case 'P2025':
        return sendError(res, 'Record not found.', 404)
      case 'P2003':
        return sendError(res, 'Foreign key constraint failed.', 400)
      default:
        break
    }
  }

  // Joi validation errors
  if (err.isJoi) return sendError(res, err.message, 422, err.details)

  // Express default
  const status  = err.statusCode || err.status || 500
  const message = err.message    || 'Internal server error.'
  return sendError(res, message, status)
}

/**
 * 404 handler – place AFTER all routes.
 */
const notFound = (req, res) => {
  sendError(res, `Route ${req.method} ${req.originalUrl} not found.`, 404)
}

module.exports = { errorHandler, notFound }
