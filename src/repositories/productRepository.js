// backend/src/repositories/productRepository.js
const db = require('../config/db');

class ProductRepository {
  async findAll(companyId, { search = '', isActive = null } = {}) {
    const params = [companyId];
    let query = `
      SELECT 
        p.id,
        p.company_id,
        p.code,
        p.name,
        p.description,
        p.unit,
        p.is_active,
        p.created_at,
        p.modified_at,
        pp.id AS current_pricing_id,
        COALESCE(pp.selling_price, 0) AS current_price,
        pp.effective_from AS price_effective_from
      FROM pos_v1.products p
      LEFT JOIN LATERAL (
        SELECT id, selling_price, effective_from
        FROM pos_v1.product_pricings
        WHERE product_id = p.id 
          AND company_id = p.company_id
          AND is_active = TRUE 
          AND is_deleted = FALSE
          AND effective_from <= CURRENT_TIMESTAMP
          AND (effective_to IS NULL OR effective_to > CURRENT_TIMESTAMP)
        ORDER BY effective_from DESC, id DESC
        LIMIT 1
      ) pp ON TRUE
      WHERE p.company_id = $1 AND p.is_deleted = FALSE
    `;

    if (isActive !== null && isActive !== undefined) {
      params.push(isActive === 'true' || isActive === true);
      query += ` AND p.is_active = $${params.length}`;
    }

    if (search && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.code) LIKE $${params.length})`;
    }

    query += ` ORDER BY p.name ASC;`;

    const res = await db.query(query, params);
    return res.rows;
  }

  async findById(companyId, productId, client = null) {
    const query = `
      SELECT 
        p.id,
        p.company_id,
        p.code,
        p.name,
        p.description,
        p.unit,
        p.is_active,
        p.created_at,
        p.modified_at,
        pp.id AS current_pricing_id,
        COALESCE(pp.selling_price, 0) AS current_price,
        pp.effective_from AS price_effective_from
      FROM pos_v1.products p
      LEFT JOIN LATERAL (
        SELECT id, selling_price, effective_from
        FROM pos_v1.product_pricings
        WHERE product_id = p.id 
          AND company_id = p.company_id
          AND is_active = TRUE 
          AND is_deleted = FALSE
          AND effective_from <= CURRENT_TIMESTAMP
          AND (effective_to IS NULL OR effective_to > CURRENT_TIMESTAMP)
        ORDER BY effective_from DESC, id DESC
        LIMIT 1
      ) pp ON TRUE
      WHERE p.company_id = $1 AND p.id = $2 AND p.is_deleted = FALSE;
    `;
    const executor = client || db;
    const res = await executor.query(query, [companyId, productId]);
    return res.rows[0] || null;
  }

  async findByCode(companyId, code) {
    const query = `
      SELECT id, company_id, code, name, unit, is_active, is_deleted
      FROM pos_v1.products
      WHERE company_id = $1 AND code = $2 AND is_deleted = FALSE;
    `;
    const res = await db.query(query, [companyId, code.trim()]);
    return res.rows[0] || null;
  }

  async create(companyId, { code, name, description = '', unit = 'PCS', userId }, client = null) {
    const query = `
      INSERT INTO pos_v1.products (company_id, code, name, description, unit, created_by, modified_by)
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING id, company_id, code, name, description, unit, is_active, created_at, modified_at;
    `;
    const executor = client || db;
    const res = await executor.query(query, [
      companyId,
      code.trim(),
      name.trim(),
      description ? description.trim() : '',
      unit ? unit.trim() : 'PCS',
      userId,
    ]);
    return res.rows[0];
  }

  async update(companyId, productId, { code, name, description, unit, userId }, client = null) {
    const fields = [];
    const params = [companyId, productId];

    if (code !== undefined) {
      params.push(code.trim());
      fields.push(`code = $${params.length}`);
    }
    if (name !== undefined) {
      params.push(name.trim());
      fields.push(`name = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description ? description.trim() : '');
      fields.push(`description = $${params.length}`);
    }
    if (unit !== undefined) {
      params.push(unit ? unit.trim() : 'PCS');
      fields.push(`unit = $${params.length}`);
    }

    params.push(userId);
    fields.push(`modified_by = $${params.length}`);
    fields.push(`modified_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE pos_v1.products
      SET ${fields.join(', ')}
      WHERE company_id = $1 AND id = $2 AND is_deleted = FALSE
      RETURNING id, company_id, code, name, description, unit, is_active, modified_at;
    `;
    const executor = client || db;
    const res = await executor.query(query, params);
    return res.rows[0] || null;
  }

  async setActiveStatus(companyId, productId, isActive, userId) {
    const query = `
      UPDATE pos_v1.products
      SET is_active = $3, modified_by = $4, modified_at = CURRENT_TIMESTAMP
      WHERE company_id = $1 AND id = $2 AND is_deleted = FALSE
      RETURNING id, company_id, code, name, is_active, modified_at;
    `;
    const res = await db.query(query, [companyId, productId, isActive, userId]);
    return res.rows[0] || null;
  }

  async softDelete(companyId, productId, userId) {
    const query = `
      UPDATE pos_v1.products
      SET is_deleted = TRUE, is_active = FALSE, modified_by = $3, modified_at = CURRENT_TIMESTAMP
      WHERE company_id = $1 AND id = $2 AND is_deleted = FALSE
      RETURNING id, is_deleted, is_active;
    `;
    const res = await db.query(query, [companyId, productId, userId]);
    return res.rows[0] || null;
  }
}

module.exports = new ProductRepository();
