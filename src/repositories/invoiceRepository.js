// backend/src/repositories/invoiceRepository.js
const db = require('../config/db');

class InvoiceRepository {
  async createInvoice(companyId, { invoiceNumber, invoiceDate, subtotal, discount, tax, totalAmount, userId }, client) {
    const query = `
      INSERT INTO pos_v1.invoices (
        company_id, invoice_number, invoice_date, subtotal, discount, tax, total_amount, created_by, modified_by
      )
      VALUES ($1, $2, COALESCE($3, CURRENT_TIMESTAMP), $4, $5, $6, $7, $8, $8)
      RETURNING id, company_id, invoice_number, invoice_date, subtotal, discount, tax, total_amount, created_at;
    `;
    const res = await client.query(query, [
      companyId,
      invoiceNumber,
      invoiceDate || null,
      subtotal,
      discount,
      tax,
      totalAmount,
      userId,
    ]);
    return res.rows[0];
  }

  async createInvoiceLine({ invoiceId, productId, productName, quantity, unitPrice, discount, tax, lineTotal, userId }, client) {
    const query = `
      INSERT INTO pos_v1.invoice_lines (
        invoice_id, product_id, product_name, quantity, unit_price, discount, tax, line_total, created_by, modified_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
      RETURNING id, invoice_id, product_id, product_name, quantity, unit_price, discount, tax, line_total;
    `;
    const res = await client.query(query, [
      invoiceId,
      productId,
      productName,
      quantity,
      unitPrice,
      discount,
      tax,
      lineTotal,
      userId,
    ]);
    return res.rows[0];
  }

  async findAll(companyId, { search = '', startDate = null, endDate = null, limit = 50, offset = 0 } = {}) {
    const params = [companyId];
    let query = `
      SELECT 
        i.id,
        i.company_id,
        i.invoice_number,
        i.invoice_date,
        i.subtotal,
        i.discount,
        i.tax,
        i.total_amount,
        i.created_at,
        COUNT(il.id) AS item_count
      FROM pos_v1.invoices i
      LEFT JOIN pos_v1.invoice_lines il ON il.invoice_id = i.id AND il.is_deleted = FALSE
      WHERE i.company_id = $1 AND i.is_deleted = FALSE
    `;

    if (search && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND LOWER(i.invoice_number) LIKE $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND i.invoice_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND i.invoice_date <= $${params.length}`;
    }

    query += `
      GROUP BY i.id
      ORDER BY i.invoice_date DESC, i.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    params.push(limit, offset);

    const res = await db.query(query, params);
    return res.rows;
  }

  async findById(companyId, invoiceId) {
    const query = `
      SELECT 
        i.id,
        i.company_id,
        i.invoice_number,
        i.invoice_date,
        i.subtotal,
        i.discount,
        i.tax,
        i.total_amount,
        i.created_at,
        c.name AS company_name,
        c.address AS company_address,
        c.phone AS company_phone,
        c.email AS company_email,
        u.full_name AS created_by_name
      FROM pos_v1.invoices i
      INNER JOIN organisation.companies c ON c.id = i.company_id
      LEFT JOIN organisation.users u ON u.id = i.created_by
      WHERE i.company_id = $1 AND i.id = $2 AND i.is_deleted = FALSE;
    `;
    const res = await db.query(query, [companyId, invoiceId]);
    return res.rows[0] || null;
  }

  async getLinesByInvoiceId(invoiceId) {
    const query = `
      SELECT 
        il.id,
        il.invoice_id,
        il.product_id,
        il.product_name,
        il.quantity,
        il.unit_price,
        il.discount,
        il.tax,
        il.line_total,
        p.code AS product_code,
        p.unit AS product_unit
      FROM pos_v1.invoice_lines il
      LEFT JOIN pos_v1.products p ON p.id = il.product_id
      WHERE il.invoice_id = $1 AND il.is_deleted = FALSE
      ORDER BY il.id ASC;
    `;
    const res = await db.query(query, [invoiceId]);
    return res.rows;
  }

  async getDashboardMetrics(companyId) {
    // 1. Total Products
    const prodCountsRes = await db.query(
      `SELECT 
         COUNT(*) AS total_products,
         COUNT(*) FILTER (WHERE is_active = TRUE) AS active_products
       FROM pos_v1.products
       WHERE company_id = $1 AND is_deleted = FALSE;`,
      [companyId]
    );

    // 2. Today's Invoices and Today's Sales
    const salesRes = await db.query(
      `SELECT 
         COUNT(*) AS today_invoices,
         COALESCE(SUM(total_amount), 0) AS today_sales
       FROM pos_v1.invoices
       WHERE company_id = $1 
         AND is_deleted = FALSE
         AND invoice_date >= CURRENT_DATE
         AND invoice_date < CURRENT_DATE + INTERVAL '1 day';`,
      [companyId]
    );

    return {
      totalProducts: parseInt(prodCountsRes.rows[0].total_products || '0', 10),
      activeProducts: parseInt(prodCountsRes.rows[0].active_products || '0', 10),
      todayInvoices: parseInt(salesRes.rows[0].today_invoices || '0', 10),
      todaySales: parseFloat(salesRes.rows[0].today_sales || '0')
    };
  }
}

module.exports = new InvoiceRepository();
