// backend/seeds/seed.js
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

async function seedDatabase() {
  console.log('🌱 Starting database seeding for POS V1...');
  const pool = new Pool(getPoolConfig());
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Demo Company
    const companyRes = await client.query(
      `INSERT INTO organisation.companies (code, name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO UPDATE
       SET name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email, address = EXCLUDED.address
       RETURNING id, code, name;`,
      ['CAFE01', 'Café Aroma', '+91 9876543210', 'contact@cafearoma.com', '123 Coffee Lane, Connaught Place, New Delhi']
    );
    const companyId = companyRes.rows[0].id;
    console.log(`☕ Company seeded: ${companyRes.rows[0].name} (ID: ${companyId})`);

    // 2. Seed Demo Admin User
    const userRes = await client.query(
      `INSERT INTO organisation.users (username, full_name, email, google_id, otp_enabled)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name, google_id = EXCLUDED.google_id
       RETURNING id, username, email;`,
      ['admin@cafearoma.com', 'Café Admin', 'admin@cafearoma.com', 'demo_google_admin_id_001', true]
    );
    const userId = userRes.rows[0].id;
    console.log(`👤 Admin user seeded: ${userRes.rows[0].email} (ID: ${userId})`);

    // 3. Link User to Company
    await client.query(
      `INSERT INTO organisation.user_company_xref (user_id, company_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, company_id) DO NOTHING;`,
      [userId, companyId]
    );
    console.log(`🔗 User linked to company.`);

    // 4. Seed Products and Pricings
    const demoProducts = [
      { code: 'ESP01', name: 'Espresso', description: 'Single shot bold artisan espresso', unit: 'CUP', price: 80.0000 },
      { code: 'CAP01', name: 'Cappuccino', description: 'Rich espresso with equal parts steamed milk and foam', unit: 'CUP', price: 140.0000 },
      { code: 'LAT01', name: 'Café Latte', description: 'Smooth espresso with velvety steamed milk and light foam', unit: 'CUP', price: 160.0000 },
      { code: 'AME01', name: 'Americano', description: 'Espresso diluted with hot water for a classic brew', unit: 'CUP', price: 110.0000 },
      { code: 'MOC01', name: 'Mocha', description: 'Espresso blended with dark chocolate and steamed milk', unit: 'CUP', price: 180.0000 },
      { code: 'CRO01', name: 'Butter Croissant', description: 'Flaky golden baked French butter croissant', unit: 'PCS', price: 95.0000 },
      { code: 'MUF01', name: 'Blueberry Muffin', description: 'Moist baked muffin with juicy fresh blueberries', unit: 'PCS', price: 120.0000 },
      { code: 'TEA01', name: 'Masala Chai', description: 'Brewed black tea with aromatic traditional spices', unit: 'CUP', price: 60.0000 },
      { code: 'GRN01', name: 'Green Tea', description: 'Organic soothing whole leaf green tea', unit: 'CUP', price: 70.0000 },
      { code: 'SND01', name: 'Grilled Cheese Sandwich', description: 'Toasted sourdough with melted cheddar and mozzarella', unit: 'PCS', price: 190.0000 }
    ];

    for (const item of demoProducts) {
      const prodRes = await client.query(
        `INSERT INTO pos_v1.products (company_id, code, name, description, unit, created_by, modified_by)
         VALUES ($1, $2, $3, $4, $5, $6, $6)
         ON CONFLICT (company_id, code) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description, unit = EXCLUDED.unit, is_active = TRUE, is_deleted = FALSE
         RETURNING id, code, name;`,
        [companyId, item.code, item.name, item.description, item.unit, userId]
      );
      const productId = prodRes.rows[0].id;

      // Check if price exists, otherwise insert initial price
      const priceCheck = await client.query(
        `SELECT id FROM pos_v1.product_pricings 
         WHERE company_id = $1 AND product_id = $2 AND is_active = TRUE AND is_deleted = FALSE;`,
        [companyId, productId]
      );

      if (priceCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO pos_v1.product_pricings (company_id, product_id, selling_price, effective_from, created_by, modified_by)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $4);`,
          [companyId, productId, item.price, userId]
        );
      }
    }
    console.log(`📦 Seeded ${demoProducts.length} products with active pricings.`);

    // 5. Seed a sample invoice for initial dashboard display
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001`;
    const invoiceCheck = await client.query(
      `SELECT id FROM pos_v1.invoices WHERE company_id = $1 AND invoice_number = $2;`,
      [companyId, invoiceNumber]
    );

    if (invoiceCheck.rows.length === 0) {
      const capProduct = await client.query(`SELECT id, name FROM pos_v1.products WHERE company_id = $1 AND code = 'CAP01';`, [companyId]);
      const croProduct = await client.query(`SELECT id, name FROM pos_v1.products WHERE company_id = $1 AND code = 'CRO01';`, [companyId]);

      if (capProduct.rows.length > 0 && croProduct.rows.length > 0) {
        const invRes = await client.query(
          `INSERT INTO pos_v1.invoices (company_id, invoice_number, invoice_date, subtotal, discount, tax, total_amount, created_by, modified_by)
           VALUES ($1, $2, CURRENT_TIMESTAMP, 375.0000, 0.0000, 0.0000, 375.0000, $3, $3)
           RETURNING id;`,
          [companyId, invoiceNumber, userId]
        );
        const invId = invRes.rows[0].id;

        // Line 1: 2 x Cappuccino @ 140 = 280
        await client.query(
          `INSERT INTO pos_v1.invoice_lines (invoice_id, product_id, product_name, quantity, unit_price, discount, tax, line_total, created_by, modified_by)
           VALUES ($1, $2, $3, 2.0000, 140.0000, 0.0000, 0.0000, 280.0000, $4, $4);`,
          [invId, capProduct.rows[0].id, capProduct.rows[0].name, userId]
        );

        // Line 2: 1 x Butter Croissant @ 95 = 95
        await client.query(
          `INSERT INTO pos_v1.invoice_lines (invoice_id, product_id, product_name, quantity, unit_price, discount, tax, line_total, created_by, modified_by)
           VALUES ($1, $2, $3, 1.0000, 95.0000, 0.0000, 0.0000, 95.0000, $4, $4);`,
          [invId, croProduct.rows[0].id, croProduct.rows[0].name, userId]
        );
        console.log(`🧾 Sample invoice created: ${invoiceNumber} (Total: ₹375.00)`);
      }
    }

    await client.query('COMMIT');
    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
