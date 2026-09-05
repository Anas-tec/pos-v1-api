// backend/src/controllers/pricingController.js
const pricingService = require('../services/pricingService');
const { validatePricingInput } = require('../validators/pricingValidator');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

class PricingController {
  async getPricingHistory(req, res, next) {
    try {
      const history = await pricingService.getPricingHistory(req.companyId, req.params.productId);
      return sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  async addPrice(req, res, next) {
    try {
      const validation = validatePricingInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 'Validation failed', 400, validation.errors);
      }

      const price = await pricingService.addPrice(
        req.companyId,
        req.params.productId,
        req.body,
        req.user.id
      );
      return sendSuccess(res, price, 201);
    } catch (error) {
      next(error);
    }
  }

  async updatePricing(req, res, next) {
    try {
      const price = await pricingService.updatePricing(
        req.companyId,
        req.params.id,
        req.body,
        req.user.id
      );
      return sendSuccess(res, price, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PricingController();
