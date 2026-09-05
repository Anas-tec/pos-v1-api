// backend/tests/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const env = require('../src/config/env');
const prefix = env.API_PREFIX || '';

describe('Authentication API Endpoints', () => {
  test(`POST ${prefix}/auth/google without token should return 400`, async () => {
    const res = await request(app)
      .post(`${prefix}/auth/google`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('token is required');
  });

  test(`GET ${prefix}/auth/me without Bearer token should return 401`, async () => {
    const res = await request(app)
      .get(`${prefix}/auth/me`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test(`GET ${prefix}/products without auth should return 401`, async () => {
    const res = await request(app)
      .get(`${prefix}/products`);

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
