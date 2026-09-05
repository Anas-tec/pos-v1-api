// backend/src/repositories/companyRepository.js
const db = require('../config/db');

class CompanyRepository {
  async findById(id) {
    const query = `
      SELECT id, code, name, phone, email, address, is_active, is_deleted
      FROM organisation.companies
      WHERE id = $1 AND is_deleted = FALSE;
    `;
    const res = await db.query(query, [id]);
    return res.rows[0] || null;
  }

  async findByCode(code) {
    const query = `
      SELECT id, code, name, phone, email, address, is_active, is_deleted
      FROM organisation.companies
      WHERE code = $1 AND is_deleted = FALSE;
    `;
    const res = await db.query(query, [code]);
    return res.rows[0] || null;
  }

  async getFirstActiveCompany() {
    const query = `
      SELECT id, code, name, phone, email, address
      FROM organisation.companies
      WHERE is_active = TRUE AND is_deleted = FALSE
      ORDER BY id ASC
      LIMIT 1;
    `;
    const res = await db.query(query);
    return res.rows[0] || null;
  }
}

module.exports = new CompanyRepository();
