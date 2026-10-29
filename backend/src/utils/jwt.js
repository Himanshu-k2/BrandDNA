import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT for an authenticated user.
 *
 * @param {Object} payload - User claims { id, role, organizationId }
 * @returns {string} Signed JWT token
 */
export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode a JWT.
 *
 * @param {string} token - Bearer JWT token
 * @returns {Object} Decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.verify(token, secret);
};
