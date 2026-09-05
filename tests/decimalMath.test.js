// backend/tests/decimalMath.test.js
const decimalMath = require('../src/utils/decimalMath');

describe('Decimal Math and Calculation Utilities', () => {
  test('calculateLineItem correctly computes subtotal and line total', () => {
    const line = decimalMath.calculateLineItem(2, 140, 0, 0);
    expect(line.quantity).toBe('2.0000');
    expect(line.unitPrice).toBe('140.0000');
    expect(line.lineSubtotal).toBe('280.0000');
    expect(line.lineTotal).toBe('280.0000');
  });

  test('calculateLineItem applies item discount and tax correctly', () => {
    const line = decimalMath.calculateLineItem(3, 100, 15, 10);
    // (3 * 100) - 15 + 10 = 295
    expect(line.lineSubtotal).toBe('300.0000');
    expect(line.discount).toBe('15.0000');
    expect(line.tax).toBe('10.0000');
    expect(line.lineTotal).toBe('295.0000');
  });

  test('calculateInvoiceTotals aggregates all lines and header discounts/taxes', () => {
    const line1 = decimalMath.calculateLineItem(2, 50, 0, 0); // 100
    const line2 = decimalMath.calculateLineItem(1, 30, 0, 0); // 30

    const totals = decimalMath.calculateInvoiceTotals([line1, line2], 10, 5);
    // Subtotal: 130, Discount: 10, Tax: 5, Total: 125
    expect(totals.subtotal).toBe('130.0000');
    expect(totals.discount).toBe('10.0000');
    expect(totals.tax).toBe('5.0000');
    expect(totals.totalAmount).toBe('125.0000');
  });
});
