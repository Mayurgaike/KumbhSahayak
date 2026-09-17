const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate a short-lived access token.
 * Payload: { id, role, zoneId }
 */
function generateAccessToken(user) {
  if (!ACCESS_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    {
      id: user._id || user.id,
      role: user.role,
      zoneId: user.zoneId || null,
    },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );
}

/**
 * Generate a longer-lived refresh token.
 * Payload: { id }
 */
function generateRefreshToken(user) {
  if (!REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }

  return jwt.sign(
    { id: user._id || user.id },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES }
  );
}

/**
 * Verify an access token.
 * Returns the decoded payload or throws a jwt error.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/**
 * Verify a refresh token.
 * Returns the decoded payload or throws a jwt error.
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

/**
 * Generate both access and refresh tokens for a user.
 */
function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
};
