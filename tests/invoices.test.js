// backend/tests/invoices.test.js
const invoiceService = require('../src/services/invoiceService');
const invoiceRepository = require('../src/repositories/invoiceRepository');
const productRepository = require('../src/repositories/productRepository');
const pricingRepository = require('../src/repositories/pricingRepository');
const db = require('../src/config/db');

jest.mock('../src/repositories/invoiceRepository');
jest.mock('../src/repositories/productRepository');
jest.mock('../src/repositories/pricingRepository');
jest.mock('../src/config/db');

describe('Invoice Service Unit Tests', () => {
  const companyId = '1';
  const userId = '1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createInvoice rejects empty items array', async () => {
    await expect(
      invoiceService.createInvoice(companyId, { items: [] }, userId)
    ).rejects.toThrow('Invoice must contain at least one item');
  });

  test('createInvoice rolls back if product is inactive or not found', async () => {
    db.withTransaction.mockImplementation(async (cb) => {
      const mockClient = { query: jest.fn() };
      return cb(mockClient);
    });

    productRepository.findById.mockResolvedValue(null);

    await expect(
      invoiceService.createInvoice(
        companyId,
        { items: [{ product_id: '99', quantity: 1 }] },
        userId
      )
    ).rejects.toThrow('Product with ID 99 was not found or is deleted.');
  });

  test('createInvoice calculates line items and totals authoritatively and saves lines', async () => {
    db.withTransaction.mockImplementation(async (cb) => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
      };
      return cb(mockClient);
    });

    productRepository.findById.mockResolvedValue({
      id: '1',
      name: 'Espresso',
      unit: 'CUP',
      is_active: true,
      current_price: '80.0000',
    });

    pricingRepository.getCurrentPrice.mockResolvedValue({
      selling_price: '80.0000',
    });

    const mockInvoice = {
      id: '101',
      invoice_number: 'INV-20260829-0001',
      subtotal: '160.0000',
      discount: '0.0000',
      tax: '0.0000',
      total_amount: '160.0000',
    };

    invoiceRepository.createInvoice.mockResolvedValue(mockInvoice);
    invoiceRepository.createInvoiceLine.mockResolvedValue({
      id: '501',
      invoice_id: '101',
      product_name: 'Espresso',
      quantity: '2.0000',
      unit_price: '80.0000',
      line_total: '160.0000',
    });

    const result = await invoiceService.createInvoice(
      companyId,
      {
        items: [{ product_id: '1', quantity: 2, discount: 0, tax: 0 }],
        discount: 0,
        tax: 0,
      },
      userId
    );

    expect(invoiceRepository.createInvoice).toHaveBeenCalled();
    expect(invoiceRepository.createInvoiceLine).toHaveBeenCalled();
    expect(result.subtotal).toBe('160.0000');
    expect(result.total_amount).toBe('160.0000');
    expect(result.lines.length).toBe(1);
  });
});
