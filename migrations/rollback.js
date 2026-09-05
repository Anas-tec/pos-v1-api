// backend/migrations/rollback.js
require('dotenv').config();
const { Pool } = require('pg');

const getPoolConfig = () => {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return {
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'pos_db',
  };
};

async function runRollback() {
  console.log('🔄 Starting database rollback for pos_v1 and organisation schemas...');
  const pool = new Pool(getPoolConfig());
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Drop pos_v1 tables first due to FK constraints
    await client.query('DROP TABLE IF EXISTS pos_v1.invoice_lines CASCADE;');
    await client.query('DROP TABLE IF EXISTS pos_v1.invoices CASCADE;');
    await client.query('DROP TABLE IF EXISTS pos_v1.product_pricings CASCADE;');
    await client.query('DROP TABLE IF EXISTS pos_v1.products CASCADE;');
    await client.query('DROP SCHEMA IF EXISTS pos_v1 CASCADE;');

    // Drop organisation tables
    await client.query('DROP TABLE IF EXISTS organisation.user_company_xref CASCADE;');
    await client.query('DROP TABLE IF EXISTS organisation.user_otps CASCADE;');
    await client.query('DROP TABLE IF EXISTS organisation.companies CASCADE;');
    await client.query('DROP TABLE IF EXISTS organisation.users CASCADE;');
    await client.query('DROP SCHEMA IF EXISTS organisation CASCADE;');

    await client.query('COMMIT');
    console.log('✅ Rollback completed. "pos_v1" and "organisation" schemas and tables have been safely dropped.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runRollback();
}

module.exports = { runRollback };
