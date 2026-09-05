// backend/src/validators/productValidator.js

function validateProductInput(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.code !== undefined) {
    if (!data.code || typeof data.code !== 'string' || data.code.trim() === '') {
      errors.push('Product code is required.');
    } else if (data.code.trim().length > 25) {
      errors.push('Product code cannot exceed 25 characters.');
    }
  }

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Product name is required.');
    } else if (data.name.trim().length > 255) {
      errors.push('Product name cannot exceed 255 characters.');
    }
  }

  if (data.unit !== undefined) {
    if (typeof data.unit !== 'string' || data.unit.trim().length === 0) {
      errors.push('Unit must be a non-empty string.');
    } else if (data.unit.trim().length > 25) {
      errors.push('Unit cannot exceed 25 characters.');
    }
  }

  if (data.selling_price !== undefined || data.initial_price !== undefined) {
    const priceVal = data.selling_price !== undefined ? data.selling_price : data.initial_price;
    const priceNum = Number(priceVal);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push('Selling price must be a non-negative number.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = {
  validateProductInput,
};
