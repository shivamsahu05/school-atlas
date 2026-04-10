// src/utils/response.js
// Standard API response helpers

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} message
 * @param {number} statusCode
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const body = { success: true, message }
  if (data !== null) body.data = data
  return res.status(statusCode).json(body)
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 * @param {*} errors
 */
const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const body = { success: false, message }
  if (errors) body.errors = errors
  return res.status(statusCode).json(body)
}

/**
 * Build a paginated response wrapper.
 */
const paginated = (data, total, page, limit) => ({
  items: data,
  pagination: {
    total,
    page:       Number(page),
    limit:      Number(limit),
    totalPages: Math.ceil(total / limit),
    hasNext:    page * limit < total,
    hasPrev:    page > 1,
  },
})

module.exports = { sendSuccess, sendError, paginated }
