// backend/src/controllers/productController.js
const productService = require('../services/productService');
const { validateProductInput } = require('../validators/productValidator');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { search, is_active } = req.query;
      const products = await productService.listProducts(req.companyId, {
        search,
        isActive: is_active,
      });
      return sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.companyId, req.params.id);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const validation = validateProductInput(req.body, false);
      if (!validation.isValid) {
        return sendError(res, 'Validation failed', 400, validation.errors);
      }

      const product = await productService.createProduct(req.companyId, req.body, req.user.id);
      return sendSuccess(res, product, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const validation = validateProductInput(req.body, true);
      if (!validation.isValid) {
        return sendError(res, 'Validation failed', 400, validation.errors);
      }

      const product = await productService.updateProduct(req.companyId, req.params.id, req.body, req.user.id);
      return sendSuccess(res, product, 200);
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(req, res, next) {
    try {
      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') {
        return sendError(res, 'Field "is_active" must be a boolean (true/false).', 400);
      }

      const product = await productService.toggleActive(req.companyId, req.params.id, is_active, req.user.id);
      return sendSuccess(res, product, 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const result = await productService.deleteProduct(req.companyId, req.params.id, req.user.id);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
