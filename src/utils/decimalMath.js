// backend/src/utils/decimalMath.js
const BigNumber = require('bignumber.js');

// Configure BigNumber
BigNumber.config({ DECIMAL_PLACES: 4, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

/**
 * Format any numeric value to 4 decimal places string
 * @param {number|string|BigNumber} val 
 * @returns {string}
 */
function toDecimal4(val) {
  const bn = new BigNumber(val || 0);
  return bn.toFixed(4);
}

/**
 * Safe addition
 */
function add(a, b) {
  return new BigNumber(a || 0).plus(new BigNumber(b || 0)).toFixed(4);
}

/**
 * Safe subtraction
 */
function subtract(a, b) {
  return new BigNumber(a || 0).minus(new BigNumber(b || 0)).toFixed(4);
}

/**
 * Safe multiplication
 */
function multiply(a, b) {
  return new BigNumber(a || 0).multipliedBy(new BigNumber(b || 0)).toFixed(4);
}

/**
 * Calculate Line Total: (quantity * unit_price) - discount + tax
 * @param {number|string} quantity 
 * @param {number|string} unitPrice 
 * @param {number|string} discount 
 * @param {number|string} tax 
 * @returns {{ lineTotal: string, lineSubtotal: string }}
 */
function calculateLineItem(quantity, unitPrice, discount = 0, tax = 0) {
  const qty = new BigNumber(quantity || 0);
  const price = new BigNumber(unitPrice || 0);
  const disc = new BigNumber(discount || 0);
  const tx = new BigNumber(tax || 0);

  const subtotal = qty.multipliedBy(price);
  const total = subtotal.minus(disc).plus(tx);

  return {
    quantity: qty.toFixed(4),
    unitPrice: price.toFixed(4),
    discount: disc.toFixed(4),
    tax: tx.toFixed(4),
    lineSubtotal: subtotal.toFixed(4),
    lineTotal: total.isLessThan(0) ? '0.0000' : total.toFixed(4)
  };
}

/**
 * Calculate Invoice Totals from line items and optional header-level discount/tax
 * @param {Array<{ lineTotal: string, lineSubtotal: string, discount: string, tax: string }>} calculatedLines 
 * @param {number|string} headerDiscount 
 * @param {number|string} headerTax 
 */
function calculateInvoiceTotals(calculatedLines, headerDiscount = 0, headerTax = 0) {
  let subtotal = new BigNumber(0);
  let totalLineDiscounts = new BigNumber(0);
  let totalLineTaxes = new BigNumber(0);

  for (const line of calculatedLines) {
    subtotal = subtotal.plus(new BigNumber(line.lineSubtotal || 0));
    totalLineDiscounts = totalLineDiscounts.plus(new BigNumber(line.discount || 0));
    totalLineTaxes = totalLineTaxes.plus(new BigNumber(line.tax || 0));
  }

  const overallDiscount = totalLineDiscounts.plus(new BigNumber(headerDiscount || 0));
  const overallTax = totalLineTaxes.plus(new BigNumber(headerTax || 0));
  
  const finalTotal = subtotal.minus(overallDiscount).plus(overallTax);

  return {
    subtotal: subtotal.toFixed(4),
    discount: overallDiscount.toFixed(4),
    tax: overallTax.toFixed(4),
    totalAmount: finalTotal.isLessThan(0) ? '0.0000' : finalTotal.toFixed(4)
  };
}

module.exports = {
  BigNumber,
  toDecimal4,
  add,
  subtract,
  multiply,
  calculateLineItem,
  calculateInvoiceTotals
};
