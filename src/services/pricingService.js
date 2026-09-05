// backend/src/services/pricingService.js
const db = require('../config/db');
const pricingRepository = require('../repositories/pricingRepository');
const productRepository = require('../repositories/productRepository');

class PricingService {
  async getPricingHistory(companyId, productId) {
    const product = await productRepository.findById(companyId, productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    const history = await pricingRepository.getPricingHistory(companyId, productId);
    return {
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
        unit: product.unit,
        currentPrice: product.current_price,
      },
      history,
    };
  }

  async addPrice(companyId, productId, priceData, userId) {
    const product = await productRepository.findById(companyId, productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    return db.withTransaction(async (client) => {
      const effectiveFrom = priceData.effective_from ? new Date(priceData.effective_from) : new Date();

      // 1. Close any existing active price record
      await pricingRepository.closeActivePrice(companyId, productId, effectiveFrom, userId, client);

      // 2. Create the new pricing record
      const newPrice = await pricingRepository.createPrice(
        companyId,
        productId,
        {
          sellingPrice: Number(priceData.selling_price),
          effectiveFrom,
          userId,
        },
        client
      );

      return newPrice;
    });
  }

  async updatePricing(companyId, pricingId, updateData, userId) {
    const existing = await pricingRepository.findById(companyId, pricingId);
    if (!existing) {
      const err = new Error('Pricing record not found.');
      err.statusCode = 404;
      throw err;
    }

    const updated = await pricingRepository.updatePrice(companyId, pricingId, { ...updateData, userId });
    return updated;
  }
}

module.exports = new PricingService();
