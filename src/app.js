// backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { sendError, sendSuccess } = require('./utils/responseFormatter');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/health', (req, res) => {
  return sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() });
});

if (env.API_PREFIX) {
  app.get(`${env.API_PREFIX}/health`, (req, res) => {
    return sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() });
  });
}

// API Routes
const apiMountPath = env.API_PREFIX || '/';
app.use(apiMountPath, routes);

// 404 Route Not Found
app.use((req, res) => {
  return sendError(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
