// backend/src/validators/pricingValidator.js

function validatePricingInput(data) {
  const errors = [];

  if (data.selling_price === undefined || data.selling_price === null || data.selling_price === '') {
    errors.push('Selling price is required.');
  } else {
    const price = Number(data.selling_price);
    if (isNaN(price) || price < 0) {
      errors.push('Selling price must be a non-negative number.');
    }
  }

  if (data.effective_from && isNaN(Date.parse(data.effective_from))) {
    errors.push('effective_from must be a valid date.');
  }

  if (data.effective_to) {
    if (isNaN(Date.parse(data.effective_to))) {
      errors.push('effective_to must be a valid date.');
    } else if (data.effective_from && new Date(data.effective_to) <= new Date(data.effective_from)) {
      errors.push('effective_to must be later than effective_from.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validatePricingInput,
};
