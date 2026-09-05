// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const { sendError } = require('../utils/responseFormatter');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authentication required. No Bearer token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.SESSION_SECRET);
    if (!decoded || !decoded.userId) {
      return sendError(res, 'Invalid authentication token payload.', 401);
    }

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.is_active || user.is_deleted) {
      return sendError(res, 'User account is inactive or not found.', 401);
    }

    const company = await userRepository.getUserCompany(user.id);
    if (!company) {
      return sendError(res, 'User is not associated with an active company.', 403);
    }

    // Attach verified user and company context to request
    req.user = user;
    req.companyId = company.id;
    req.company = company;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Authentication token has expired. Please login again.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
}

module.exports = authMiddleware;
