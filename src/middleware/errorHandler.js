// backend/src/middleware/errorHandler.js
const { sendError } = require('../utils/responseFormatter');

function errorHandler(err, req, res, next) {
  // Log internal error for server monitoring
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  const statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle unique constraint violation in Postgres (code 23505)
  if (err.code === '23505') {
    message = 'A record with duplicate unique identifier already exists.';
    return sendError(res, message, 409);
  }

  // Handle foreign key constraint violation (code 23503)
  if (err.code === '23503') {
    message = 'Referenced resource does not exist.';
    return sendError(res, message, 400);
  }

  // Sanitize internal server errors
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected internal server error occurred.';
  }

  return sendError(res, message, statusCode);
}

module.exports = errorHandler;
