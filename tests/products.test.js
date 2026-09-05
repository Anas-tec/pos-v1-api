// backend/tests/products.test.js
const productService = require('../src/services/productService');
const productRepository = require('../src/repositories/productRepository');
const pricingRepository = require('../src/repositories/pricingRepository');
const db = require('../src/config/db');

// Mock repositories and db
jest.mock('../src/repositories/productRepository');
jest.mock('../src/repositories/pricingRepository');
jest.mock('../src/config/db');

describe('Product Service Unit Tests', () => {
  const companyId = '1';
  const userId = '1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('listProducts delegates to productRepository.findAll', async () => {
    const mockProducts = [
      { id: '1', code: 'ESP01', name: 'Espresso', current_price: '80.0000' },
    ];
    productRepository.findAll.mockResolvedValue(mockProducts);

    const result = await productService.listProducts(companyId, {});
    expect(productRepository.findAll).toHaveBeenCalledWith(companyId, {});
    expect(result).toEqual(mockProducts);
  });

  test('getProductById throws 404 when product does not exist', async () => {
    productRepository.findById.mockResolvedValue(null);

    await expect(productService.getProductById(companyId, '999')).rejects.toThrow('Product not found');
  });

  test('createProduct rejects duplicate product code', async () => {
    productRepository.findByCode.mockResolvedValue({ id: '1', code: 'ESP01' });

    await expect(
      productService.createProduct(companyId, { code: 'ESP01', name: 'Espresso' }, userId)
    ).rejects.toThrow("Product with code 'ESP01' already exists.");
  });

  test('createProduct creates product and initial pricing within transaction', async () => {
    productRepository.findByCode.mockResolvedValue(null);
    db.withTransaction.mockImplementation(async (cb) => {
      const mockClient = {};
      return cb(mockClient);
    });

    const mockCreated = { id: '1', code: 'CAP01', name: 'Cappuccino', unit: 'CUP' };
    productRepository.create.mockResolvedValue(mockCreated);
    pricingRepository.createPrice.mockResolvedValue({ id: '10', selling_price: '140.0000' });

    const result = await productService.createProduct(
      companyId,
      { code: 'CAP01', name: 'Cappuccino', unit: 'CUP', selling_price: 140 },
      userId
    );

    expect(productRepository.create).toHaveBeenCalled();
    expect(pricingRepository.createPrice).toHaveBeenCalled();
    expect(result.current_price).toBe('140.0000');
  });

  test('toggleActive updates status', async () => {
    productRepository.findById.mockResolvedValue({ id: '1', is_active: true });
    productRepository.setActiveStatus.mockResolvedValue({ id: '1', is_active: false });

    const result = await productService.toggleActive(companyId, '1', false, userId);
    expect(result.is_active).toBe(false);
  });

  test('deleteProduct sets soft delete flags', async () => {
    productRepository.findById.mockResolvedValue({ id: '1', is_active: true, is_deleted: false });
    productRepository.softDelete.mockResolvedValue({ id: '1', is_deleted: true, is_active: false });

    const result = await productService.deleteProduct(companyId, '1', userId);
    expect(productRepository.softDelete).toHaveBeenCalledWith(companyId, '1', userId);
    expect(result.success).toBe(true);
  });
});
