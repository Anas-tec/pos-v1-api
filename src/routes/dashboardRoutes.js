// backend/src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET ${API_PREFIX}/dashboard
router.get('/', dashboardController.getMetrics);

module.exports = router;
