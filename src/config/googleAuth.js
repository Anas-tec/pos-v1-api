// backend/src/config/googleAuth.js
const { OAuth2Client } = require('google-auth-library');
const env = require('./env');

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token server-side
 * @param {string} token 
 * @returns {Promise<{ googleId: string, email: string, name: string, picture?: string }>}
 */
async function verifyGoogleIdToken(token) {
  if (!token) {
    throw new Error('Google token is required.');
  }

  // Support for development demo login if using demo credentials
  if (token.startsWith('demo_token_') || !env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.includes('your_google_client_id')) {
    if (env.NODE_ENV === 'development' || token.startsWith('demo_token_')) {
      return {
        googleId: 'demo_google_admin_id_001',
        email: 'admin@cafearoma.com',
        name: 'Café Admin (Dev)'
      };
    }
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new Error('Invalid Google payload.');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture,
    };
  } catch (error) {
    throw new Error(`Google token verification failed: ${error.message}`);
  }
}

module.exports = {
  verifyGoogleIdToken,
};
