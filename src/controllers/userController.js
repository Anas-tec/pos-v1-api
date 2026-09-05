// backend/src/controllers/userController.js
const authService = require('../services/authService');
const { sendSuccess } = require('../utils/responseFormatter');

class UserController {
  async getProfile(req, res, next) {
    try {
      const profile = await authService.getUserProfile(req.user.id);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
