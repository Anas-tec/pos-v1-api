// backend/src/controllers/invoiceController.js
const invoiceService = require('../services/invoiceService');
const { validateInvoiceInput } = require('../validators/invoiceValidator');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

class InvoiceController {
  async createInvoice(req, res, next) {
    try {
      const validation = validateInvoiceInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 'Validation failed', 400, validation.errors);
      }

      const invoice = await invoiceService.createInvoice(req.companyId, req.body, req.user.id);
      return sendSuccess(res, invoice, 201);
    } catch (error) {
      next(error);
    }
  }

  async getInvoices(req, res, next) {
    try {
      const { search, start_date, end_date, limit, offset } = req.query;
      const invoices = await invoiceService.listInvoices(req.companyId, {
        search,
        startDate: start_date,
        endDate: end_date,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });
      return sendSuccess(res, invoices);
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.companyId, req.params.id);
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InvoiceController();
