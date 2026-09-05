// backend/migrations/migrate.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  const pool = new Pool(getPoolConfig());
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const migrationFile = path.join(__dirname, '001_create_schemas_and_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log(`📄 Executing migration: ${path.basename(migrationFile)}`);
    await client.query(sql);

    await client.query('COMMIT');
    console.log('✅ Migrations executed successfully! Schemas "organisation" and "pos_v1" are up to date.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
