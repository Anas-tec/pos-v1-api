// backend/src/utils/responseFormatter.js

/**
 * Standard Success Response
 * @param {import('express').Response} res 
 * @param {any} data 
 * @param {number} statusCode 
 */
function sendSuccess(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Standard Error Response
 * @param {import('express').Response} res 
 * @param {string} message 
 * @param {number} statusCode 
 * @param {any} errors 
 */
function sendError(res, message = 'An error occurred', statusCode = 400, errors = null) {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
}

module.exports = {
  sendSuccess,
  sendError,
};
