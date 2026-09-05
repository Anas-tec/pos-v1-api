// backend/src/services/invoiceService.js
const db = require('../config/db');
const invoiceRepository = require('../repositories/invoiceRepository');
const productRepository = require('../repositories/productRepository');
const pricingRepository = require('../repositories/pricingRepository');
const decimalMath = require('../utils/decimalMath');
const { generateInvoiceNumber } = require('../utils/invoiceNumberGenerator');

class InvoiceService {
  /**
   * Create an invoice with lines inside a transactional boundary
   */
  async createInvoice(companyId, invoiceData, userId) {
    if (!invoiceData.items || invoiceData.items.length === 0) {
      const err = new Error('Invoice must contain at least one item.');
      err.statusCode = 400;
      throw err;
    }

    return db.withTransaction(async (client) => {
      const calculatedLines = [];

      // 1. Process each line item, verify product ownership and fetch authoritative price
      for (const item of invoiceData.items) {
        const product = await productRepository.findById(companyId, item.product_id, client);
        if (!product) {
          const err = new Error(`Product with ID ${item.product_id} was not found or is deleted.`);
          err.statusCode = 404;
          throw err;
        }

        if (!product.is_active) {
          const err = new Error(`Product '${product.name}' is currently inactive.`);
          err.statusCode = 400;
          throw err;
        }

        // Fetch current active price
        const currentPricing = await pricingRepository.getCurrentPrice(companyId, product.id, client);
        const unitPrice = currentPricing ? currentPricing.selling_price : (product.current_price || 0);

        if (!unitPrice || Number(unitPrice) < 0) {
          const err = new Error(`Product '${product.name}' does not have an active selling price configured.`);
          err.statusCode = 400;
          throw err;
        }

        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          const err = new Error(`Invalid quantity for product '${product.name}'.`);
          err.statusCode = 400;
          throw err;
        }

        // Server-side authoritative calculation
        const lineCalc = decimalMath.calculateLineItem(
          qty,
          unitPrice,
          item.discount || 0,
          item.tax || 0
        );

        calculatedLines.push({
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          quantity: lineCalc.quantity,
          unitPrice: lineCalc.unitPrice,
          discount: lineCalc.discount,
          tax: lineCalc.tax,
          lineSubtotal: lineCalc.lineSubtotal,
          lineTotal: lineCalc.lineTotal,
        });
      }

      // 2. Authoritative Invoice Totals Calculation
      const totals = decimalMath.calculateInvoiceTotals(
        calculatedLines,
        invoiceData.discount || 0,
        invoiceData.tax || 0
      );

      // 3. Generate Unique Invoice Number (e.g. INV-20260829-0001)
      const invoiceNumber = await generateInvoiceNumber(client, companyId);

      // 4. Insert Invoice record
      const invoice = await invoiceRepository.createInvoice(
        companyId,
        {
          invoiceNumber,
          invoiceDate: invoiceData.invoice_date || null,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          totalAmount: totals.totalAmount,
          userId,
        },
        client
      );

      // 5. Insert all Invoice Lines
      const savedLines = [];
      for (const line of calculatedLines) {
        const savedLine = await invoiceRepository.createInvoiceLine(
          {
            invoiceId: invoice.id,
            productId: line.productId,
            productName: line.productName,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            tax: line.tax,
            lineTotal: line.lineTotal,
            userId,
          },
          client
        );
        savedLines.push(savedLine);
      }

      invoice.lines = savedLines;
      return invoice;
    });
  }

  async listInvoices(companyId, filters) {
    return invoiceRepository.findAll(companyId, filters);
  }

  async getInvoiceById(companyId, invoiceId) {
    const invoice = await invoiceRepository.findById(companyId, invoiceId);
    if (!invoice) {
      const err = new Error('Invoice not found.');
      err.statusCode = 404;
      throw err;
    }

    const lines = await invoiceRepository.getLinesByInvoiceId(invoiceId);
    invoice.lines = lines;
    return invoice;
  }
}

module.exports = new InvoiceService();
