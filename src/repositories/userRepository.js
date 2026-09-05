// backend/src/repositories/userRepository.js
const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const query = `
      SELECT id, username, full_name, email, google_id, otp_enabled, is_active, is_deleted
      FROM organisation.users
      WHERE email = $1 AND is_deleted = FALSE;
    `;
    const res = await db.query(query, [email.toLowerCase()]);
    return res.rows[0] || null;
  }

  async findByGoogleId(googleId) {
    const query = `
      SELECT id, username, full_name, email, google_id, otp_enabled, is_active, is_deleted
      FROM organisation.users
      WHERE google_id = $1 AND is_deleted = FALSE;
    `;
    const res = await db.query(query, [googleId]);
    return res.rows[0] || null;
  }

  async findById(id) {
    const query = `
      SELECT id, username, full_name, email, google_id, otp_enabled, is_active, is_deleted, created_at
      FROM organisation.users
      WHERE id = $1 AND is_deleted = FALSE;
    `;
    const res = await db.query(query, [id]);
    return res.rows[0] || null;
  }

  async createGoogleUser({ username, full_name, email, google_id }) {
    const query = `
      INSERT INTO organisation.users (username, full_name, email, google_id, otp_enabled)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id, username, full_name, email, google_id, otp_enabled, is_active, is_deleted, created_at;
    `;
    const res = await db.query(query, [
      username || email.toLowerCase(),
      full_name || email.split('@')[0],
      email.toLowerCase(),
      google_id,
    ]);
    return res.rows[0];
  }

  async linkUserCompany(userId, companyId) {
    const query = `
      INSERT INTO organisation.user_company_xref (user_id, company_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, company_id) DO NOTHING;
    `;
    await db.query(query, [userId, companyId]);
  }

  async getUserCompany(userId) {
    const query = `
      SELECT c.id, c.code, c.name, c.phone, c.email, c.address
      FROM organisation.companies c
      INNER JOIN organisation.user_company_xref x ON x.company_id = c.id
      WHERE x.user_id = $1 AND x.is_active = TRUE AND x.is_deleted = FALSE AND c.is_active = TRUE AND c.is_deleted = FALSE
      LIMIT 1;
    `;
    const res = await db.query(query, [userId]);
    return res.rows[0] || null;
  }
}

module.exports = new UserRepository();
