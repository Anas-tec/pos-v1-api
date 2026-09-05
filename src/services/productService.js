// backend/src/services/productService.js
const db = require('../config/db');
const productRepository = require('../repositories/productRepository');
const pricingRepository = require('../repositories/pricingRepository');

class ProductService {
  async listProducts(companyId, filters) {
    return productRepository.findAll(companyId, filters);
  }

  async getProductById(companyId, productId) {
    const product = await productRepository.findById(companyId, productId);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }
    return product;
  }

  async createProduct(companyId, productData, userId) {
    // Check if code already exists in this company
    const existing = await productRepository.findByCode(companyId, productData.code);
    if (existing) {
      const err = new Error(`Product with code '${productData.code}' already exists.`);
      err.statusCode = 409;
      throw err;
    }

    return db.withTransaction(async (client) => {
      // 1. Create product
      const product = await productRepository.create(
        companyId,
        {
          code: productData.code,
          name: productData.name,
          description: productData.description,
          unit: productData.unit,
          userId,
        },
        client
      );

      // 2. Create initial price if provided
      const priceVal = productData.selling_price !== undefined ? productData.selling_price : productData.initial_price;
      if (priceVal !== undefined && priceVal !== null && priceVal !== '') {
        const pricing = await pricingRepository.createPrice(
          companyId,
          product.id,
          {
            sellingPrice: Number(priceVal),
            effectiveFrom: productData.effective_from || null,
            userId,
          },
          client
        );
        product.current_pricing_id = pricing.id;
        product.current_price = pricing.selling_price;
      } else {
        product.current_pricing_id = null;
        product.current_price = '0.0000';
      }

      return product;
    });
  }

  async updateProduct(companyId, productId, updateData, userId) {
    // Check existence
    const existing = await productRepository.findById(companyId, productId);
    if (!existing) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    // If code is changing, ensure uniqueness
    if (updateData.code && updateData.code.trim() !== existing.code) {
      const duplicate = await productRepository.findByCode(companyId, updateData.code);
      if (duplicate && duplicate.id !== productId) {
        const err = new Error(`Product with code '${updateData.code}' already exists.`);
        err.statusCode = 409;
        throw err;
      }
    }

    const updated = await productRepository.update(companyId, productId, { ...updateData, userId });
    return updated;
  }

  async toggleActive(companyId, productId, isActive, userId) {
    const existing = await productRepository.findById(companyId, productId);
    if (!existing) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    const updated = await productRepository.setActiveStatus(companyId, productId, isActive, userId);
    return updated;
  }

  async deleteProduct(companyId, productId, userId) {
    const existing = await productRepository.findById(companyId, productId);
    if (!existing) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      throw err;
    }

    await productRepository.softDelete(companyId, productId, userId);
    return { success: true, message: 'Product successfully deleted.' };
  }
}

module.exports = new ProductService();
