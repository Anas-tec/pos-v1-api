// backend/tests/validators.test.js
const { validateProductInput } = require('../src/validators/productValidator');
const { validatePricingInput } = require('../src/validators/pricingValidator');
const { validateInvoiceInput } = require('../src/validators/invoiceValidator');

describe('Payload Validators', () => {
  describe('Product Validator', () => {
    test('rejects empty code and name', () => {
      const result = validateProductInput({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    test('rejects code longer than 25 chars', () => {
      const result = validateProductInput({
        code: 'A'.repeat(26),
        name: 'Valid Name',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('cannot exceed 25 characters');
    });

    test('accepts valid product payload', () => {
      const result = validateProductInput({
        code: 'ESP01',
        name: 'Espresso',
        unit: 'CUP',
        selling_price: 80,
      });
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Pricing Validator', () => {
    test('rejects missing or negative price', () => {
      const res1 = validatePricingInput({});
      expect(res1.isValid).toBe(false);

      const res2 = validatePricingInput({ selling_price: -10 });
      expect(res2.isValid).toBe(false);
    });

    test('accepts valid pricing with effective dates', () => {
      const res = validatePricingInput({
        selling_price: 120,
        effective_from: '2026-08-01T00:00:00Z',
        effective_to: '2026-12-31T00:00:00Z',
      });
      expect(res.isValid).toBe(true);
    });

    test('rejects effective_to that is before effective_from', () => {
      const res = validatePricingInput({
        selling_price: 120,
        effective_from: '2026-10-01T00:00:00Z',
        effective_to: '2026-08-01T00:00:00Z',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('later than effective_from');
    });
  });

  describe('Invoice Validator', () => {
    test('rejects empty items array', () => {
      const res = validateInvoiceInput({ items: [] });
      expect(res.isValid).toBe(false);
    });

    test('rejects invalid quantity', () => {
      const res = validateInvoiceInput({
        items: [{ product_id: '1', quantity: 0 }],
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('quantity must be greater than 0');
    });

    test('accepts valid invoice items', () => {
      const res = validateInvoiceInput({
        items: [{ product_id: '1', quantity: 2, discount: 5, tax: 2 }],
        discount: 0,
        tax: 0,
      });
      expect(res.isValid).toBe(true);
    });
  });
});
