// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const authService = require('../src/services/authService');

describe('Authentication API Endpoints', () => {
  test('POST /api/auth/google without token should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('token is required');
  });

  test('GET /api/auth/me without Bearer token should return 401', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/products without auth should return 401', async () => {
    const res = await request(app)
      .get('/api/products');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
