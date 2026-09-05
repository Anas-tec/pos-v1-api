// backend/src/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET  ${API_PREFIX}/invoices
// POST ${API_PREFIX}/invoices
// GET  ${API_PREFIX}/invoices/:id
router.get('/', invoiceController.getInvoices);
router.post('/', invoiceController.createInvoice);
router.get('/:id', invoiceController.getInvoiceById);

module.exports = router;
