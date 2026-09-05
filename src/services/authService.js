// backend/src/services/authService.js
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { verifyGoogleIdToken } = require('../config/googleAuth');
const userRepository = require('../repositories/userRepository');
const companyRepository = require('../repositories/companyRepository');
const db = require('../config/db');

class AuthService {
  /**
   * Process Google Login
   * @param {string} googleToken 
   */
  async handleGoogleLogin(googleToken) {
    const verified = await verifyGoogleIdToken(googleToken);

    // 1. Check if user exists by google_id or email
    let user = await userRepository.findByGoogleId(verified.googleId);
    if (!user) {
      user = await userRepository.findByEmail(verified.email);
      if (user && !user.google_id) {
        // Link existing email user with google_id
        await db.query(
          `UPDATE organisation.users SET google_id = $1, full_name = $2, modified_at = CURRENT_TIMESTAMP WHERE id = $3`,
          [verified.googleId, verified.name, user.id]
        );
        user.google_id = verified.googleId;
        user.full_name = verified.name;
      }
    }

    // 2. If new user, create in organisation.users
    if (!user) {
      user = await userRepository.createGoogleUser({
        username: verified.email,
        full_name: verified.name,
        email: verified.email,
        google_id: verified.googleId,
      });
    }

    if (!user.is_active || user.is_deleted) {
      throw new Error('This user account is inactive or disabled.');
    }

    // 3. Find or link company
    let company = await userRepository.getUserCompany(user.id);
    if (!company) {
      // Find default active company or create one
      company = await companyRepository.getFirstActiveCompany();
      if (!company) {
        // Auto-create default company if fresh database
        const compRes = await db.query(
          `INSERT INTO organisation.companies (code, name, email) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
           RETURNING id, code, name, phone, email, address;`,
          ['CAFE01', 'Café Aroma', verified.email]
        );
        company = compRes.rows[0];
      }
      await userRepository.linkUserCompany(user.id, company.id);
    }

    // 4. Generate JWT session token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        companyId: company.id,
      },
      env.SESSION_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        googleId: user.google_id,
        otpEnabled: user.otp_enabled, // Retained for future
      },
      company: {
        id: company.id,
        code: company.code,
        name: company.name,
        phone: company.phone,
        email: company.email,
        address: company.address,
      },
    };
  }

  /**
   * Get authenticated user profile
   * @param {string|number} userId 
   */
  async getUserProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const company = await userRepository.getUserCompany(userId);

    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      googleId: user.google_id,
      otpEnabled: user.otp_enabled,
      createdAt: user.created_at,
      company: company || null,
    };
  }
}

module.exports = new AuthService();
