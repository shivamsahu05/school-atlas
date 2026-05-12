// src/utils/responseHelper.js

/**
 * Standardizes API responses across the application
 * @param {Object} res - Express response object
 * @param {Boolean} success - Whether the request was successful
 * @param {Object|Array} data - The payload to return
 * @param {String} message - A user-friendly message
 * @param {Number} status - HTTP status code
 */
const sendResponse = (res, success, data = null, message = '', status = 200) => {
  return res.status(status).json({
    success,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standardizes error responses
 * @param {Object} res - Express response object
 * @param {Error|String} error - The error object or message
 * @param {Number} status - HTTP status code
 */
const sendError = (res, error, status = 500) => {
  const message = typeof error === 'string' ? error : (error.message || 'Internal Server Error');
  console.error(`[API ERROR] ${message}`, error);
  
  return res.status(status).json({
    success: false,
    data: null,
    message,
    error: process.env.NODE_ENV === 'development' ? error : {},
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  sendResponse,
  sendError
};
