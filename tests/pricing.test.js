// backend/tests/pricing.test.js
const pricingService = require('../src/services/pricingService');
const pricingRepository = require('../src/repositories/pricingRepository');
const productRepository = require('../src/repositories/productRepository');
const db = require('../src/config/db');

jest.mock('../src/repositories/pricingRepository');
jest.mock('../src/repositories/productRepository');
jest.mock('../src/config/db');

describe('Pricing Service Unit Tests', () => {
  const companyId = '1';
  const productId = '5';
  const userId = '1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPricingHistory returns product header and list of historic prices', async () => {
    productRepository.findById.mockResolvedValue({
      id: productId,
      code: 'LAT01',
      name: 'Latte',
      unit: 'CUP',
      current_price: '160.0000',
    });

    const mockHistory = [
      { id: '2', selling_price: '160.0000', effective_from: '2026-08-01', effective_to: null },
      { id: '1', selling_price: '150.0000', effective_from: '2026-01-01', effective_to: '2026-08-01' },
    ];
    pricingRepository.getPricingHistory.mockResolvedValue(mockHistory);

    const result = await pricingService.getPricingHistory(companyId, productId);
    expect(result.product.name).toBe('Latte');
    expect(result.history.length).toBe(2);
  });

  test('addPrice closes prior active price and opens new price in a transaction', async () => {
    productRepository.findById.mockResolvedValue({ id: productId });
    db.withTransaction.mockImplementation(async (cb) => {
      const mockClient = {};
      return cb(mockClient);
    });

    pricingRepository.createPrice.mockResolvedValue({
      id: '3',
      selling_price: '180.0000',
      effective_from: new Date(),
    });

    const result = await pricingService.addPrice(
      companyId,
      productId,
      { selling_price: 180 },
      userId
    );

    expect(pricingRepository.closeActivePrice).toHaveBeenCalled();
    expect(pricingRepository.createPrice).toHaveBeenCalled();
    expect(result.selling_price).toBe('180.0000');
  });
});
