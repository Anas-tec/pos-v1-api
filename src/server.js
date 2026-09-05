// backend/src/server.js
const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');

const PORT = env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`🚀 POS V1 Backend API running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);

  // Test database connection on startup
  try {
    const res = await pool.query('SELECT NOW() AS current_time;');
    console.log(`📦 PostgreSQL Database connected successfully at ${res.rows[0].current_time}`);
  } catch (err) {
    console.warn(`⚠️ PostgreSQL connection warning: ${err.message}`);
    console.warn(`👉 Please ensure your database is running and DATABASE_URL is configured in backend/.env`);
  }
});

// Graceful shutdown
const handleShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await pool.end();
    console.log('PostgreSQL pool closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
