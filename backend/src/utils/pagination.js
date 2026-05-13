// src/utils/pagination.js

/**
 * Parse page & limit from query params with sane defaults.
 * Returns { skip, take, page, limit }
 */
const parsePagination = (query) => {
  const page  = Math.max(1, parseInt(query.page  ?? 1,  10))
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? 20, 10)))
  const skip  = (page - 1) * limit
  return { skip, take: limit, page, limit }
}

module.exports = { parsePagination }
