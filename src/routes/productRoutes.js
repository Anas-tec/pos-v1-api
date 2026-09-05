// backend/src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const pricingController = require('../controllers/pricingController');
const authMiddleware = require('../middleware/authMiddleware');

// All product routes require authentication and company scope
router.use(authMiddleware);

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.patch('/:id/active', productController.toggleActive);
router.delete('/:id', productController.deleteProduct);

// Nested product pricing routes as per spec:
// GET  /api/products/:productId/prices
// POST /api/products/:productId/prices
router.get('/:productId/prices', pricingController.getPricingHistory);
router.post('/:productId/prices', pricingController.addPrice);

module.exports = router;
