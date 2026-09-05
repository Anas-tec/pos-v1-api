// backend/src/services/dashboardService.js
const invoiceRepository = require('../repositories/invoiceRepository');

class DashboardService {
  async getMetrics(companyId) {
    const metrics = await invoiceRepository.getDashboardMetrics(companyId);
    return metrics;
  }
}

module.exports = new DashboardService();
