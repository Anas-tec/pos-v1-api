// backend/src/validators/invoiceValidator.js

function validateInvoiceInput(data) {
  const errors = [];

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Invoice must contain at least one item (items array is required).');
    return { isValid: false, errors };
  }

  data.items.forEach((item, index) => {
    if (!item.product_id) {
      errors.push(`Item at line ${index + 1}: product_id is required.`);
    }

    const qty = Number(item.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.push(`Item at line ${index + 1}: quantity must be greater than 0.`);
    }

    if (item.discount !== undefined) {
      const disc = Number(item.discount);
      if (isNaN(disc) || disc < 0) {
        errors.push(`Item at line ${index + 1}: discount must be non-negative.`);
      }
    }

    if (item.tax !== undefined) {
      const tx = Number(item.tax);
      if (isNaN(tx) || tx < 0) {
        errors.push(`Item at line ${index + 1}: tax must be non-negative.`);
      }
    }
  });

  if (data.discount !== undefined) {
    const headerDisc = Number(data.discount);
    if (isNaN(headerDisc) || headerDisc < 0) {
      errors.push('Invoice header discount must be a non-negative number.');
    }
  }

  if (data.tax !== undefined) {
    const headerTax = Number(data.tax);
    if (isNaN(headerTax) || headerTax < 0) {
      errors.push('Invoice header tax must be a non-negative number.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateInvoiceInput,
};
