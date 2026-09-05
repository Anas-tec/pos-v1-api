// backend/src/routes/pricingRoutes.js
const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// PUT ${API_PREFIX}/product-pricings/:id
router.put('/:id', pricingController.updatePricing);

module.exports = router;
