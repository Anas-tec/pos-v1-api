// backend/src/repositories/pricingRepository.js
const db = require('../config/db');

class PricingRepository {
  async getCurrentPrice(companyId, productId, client = null) {
    const query = `
      SELECT id, company_id, product_id, selling_price, effective_from, effective_to, is_active, created_at
      FROM pos_v1.product_pricings
      WHERE company_id = $1 
        AND product_id = $2 
        AND is_active = TRUE 
        AND is_deleted = FALSE
        AND effective_from <= CURRENT_TIMESTAMP
        AND (effective_to IS NULL OR effective_to > CURRENT_TIMESTAMP)
      ORDER BY effective_from DESC, id DESC
      LIMIT 1;
    `;
    const executor = client || db;
    const res = await executor.query(query, [companyId, productId]);
    return res.rows[0] || null;
  }

  async getPricingHistory(companyId, productId) {
    const query = `
      SELECT id, company_id, product_id, selling_price, effective_from, effective_to, is_active, created_at, modified_at
      FROM pos_v1.product_pricings
      WHERE company_id = $1 AND product_id = $2 AND is_deleted = FALSE
      ORDER BY effective_from DESC, id DESC;
    `;
    const res = await db.query(query, [companyId, productId]);
    return res.rows;
  }

  async findById(companyId, pricingId, client = null) {
    const query = `
      SELECT id, company_id, product_id, selling_price, effective_from, effective_to, is_active, is_deleted, created_at
      FROM pos_v1.product_pricings
      WHERE company_id = $1 AND id = $2 AND is_deleted = FALSE;
    `;
    const executor = client || db;
    const res = await executor.query(query, [companyId, pricingId]);
    return res.rows[0] || null;
  }

  async closeActivePrice(companyId, productId, closeDate, userId, client = null) {
    const query = `
      UPDATE pos_v1.product_pricings
      SET effective_to = $3, modified_by = $4, modified_at = CURRENT_TIMESTAMP
      WHERE company_id = $1 
        AND product_id = $2 
        AND is_deleted = FALSE 
        AND (effective_to IS NULL OR effective_to > $3);
    `;
    const executor = client || db;
    await executor.query(query, [companyId, productId, closeDate, userId]);
  }

  async createPrice(companyId, productId, { sellingPrice, effectiveFrom, userId }, client = null) {
    const query = `
      INSERT INTO pos_v1.product_pricings (company_id, product_id, selling_price, effective_from, created_by, modified_by)
      VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP), $5, $5)
      RETURNING id, company_id, product_id, selling_price, effective_from, effective_to, is_active, created_at;
    `;
    const executor = client || db;
    const res = await executor.query(query, [
      companyId,
      productId,
      sellingPrice,
      effectiveFrom || null,
      userId,
    ]);
    return res.rows[0];
  }

  async updatePrice(companyId, pricingId, { sellingPrice, effectiveFrom, effectiveTo, userId }, client = null) {
    const fields = [];
    const params = [companyId, pricingId];

    if (sellingPrice !== undefined) {
      params.push(sellingPrice);
      fields.push(`selling_price = $${params.length}`);
    }
    if (effectiveFrom !== undefined) {
      params.push(effectiveFrom);
      fields.push(`effective_from = $${params.length}`);
    }
    if (effectiveTo !== undefined) {
      params.push(effectiveTo);
      fields.push(`effective_to = $${params.length}`);
    }

    params.push(userId);
    fields.push(`modified_by = $${params.length}`);
    fields.push(`modified_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE pos_v1.product_pricings
      SET ${fields.join(', ')}
      WHERE company_id = $1 AND id = $2 AND is_deleted = FALSE
      RETURNING id, company_id, product_id, selling_price, effective_from, effective_to, is_active, modified_at;
    `;
    const executor = client || db;
    const res = await executor.query(query, params);
    return res.rows[0] || null;
  }
}

module.exports = new PricingRepository();
