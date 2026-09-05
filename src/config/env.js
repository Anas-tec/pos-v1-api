// backend/src/config/env.js
require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  DB_USER: process.env.DB_USER || process.env.PGUSER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || process.env.PGDATABASE || 'pos_db',
  PGHOST: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  PGPORT: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  PGUSER: process.env.DB_USER || process.env.PGUSER || 'postgres',
  PGPASSWORD: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
  PGDATABASE: process.env.DB_NAME || process.env.PGDATABASE || 'pos_db',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev_pos_v1_secret_key_cafe_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d'
};

module.exports = env;
