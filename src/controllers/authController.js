// backend/src/controllers/authController.js
const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

class AuthController {
  async googleLogin(req, res, next) {
    try {
      const { credential, token } = req.body;
      const googleToken = credential || token;

      if (!googleToken) {
        return sendError(res, 'Google authentication token is required.', 400);
      }

      const result = await authService.handleGoogleLogin(googleToken);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await authService.getUserProfile(req.user.id);
      return sendSuccess(res, profile, 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    return sendSuccess(res, { message: 'Logged out successfully.' }, 200);
  }
}

module.exports = new AuthController();
