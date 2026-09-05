// backend/src/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/responseFormatter');

class DashboardController {
  async getMetrics(req, res, next) {
    try {
      const metrics = await dashboardService.getMetrics(req.companyId);
      return sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
