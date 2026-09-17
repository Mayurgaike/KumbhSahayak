const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateTokenPair, verifyRefreshToken } = require('../services/token.service');
const logger = require('../config/logger');

const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Visitor self-registration only. Role is hardcoded to 'visitor' server-side.
 * Admin/volunteer account creation is handled by a separate admin-only endpoint (Module 2).
 */
async function register(req, res, next) {
  try {
    const { name, phone, email, password } = req.body;

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_PHONE',
          message: 'An account with this phone number already exists',
        },
      });
    }

    // Check if email already exists (when provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'An account with this email already exists',
          },
        });
      }
    }

    // Hash password — never log or return the hash
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with role hardcoded to 'visitor'
    const user = await User.create({
      role: 'visitor',
      name,
      phone,
      email: email || undefined,
      passwordHash,
      zoneId: null,
    });

    // Generate token pair
    const tokens = generateTokenPair(user);

    // Persist refresh token
    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });

    logger.info('Visitor registered', { userId: user._id });

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email || null,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticate by phone + password. Returns access and refresh tokens.
 * Works for all roles — visitors, volunteers, admins, superadmins.
 */
async function login(req, res, next) {
  try {
    const { phone, password } = req.body;

    // Find user and explicitly select passwordHash (excluded by default)
    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid phone number or password',
        },
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'This account has been deactivated by an administrator',
        },
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid phone number or password',
        },
      });
    }

    // Generate token pair
    const tokens = generateTokenPair(user);

    // Persist refresh token
    await User.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });

    logger.info('User logged in', { userId: user._id, role: user.role });

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email || null,
        role: user.role,
        zoneId: user.zoneId || null,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Takes a refresh token, verifies it, and returns a new access token.
 * Does NOT rotate the refresh token (avoids race conditions in mobile apps).
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    // Verify the refresh token signature and expiry
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: {
            code: 'REFRESH_TOKEN_EXPIRED',
            message: 'Refresh token has expired — please log in again',
          },
        });
      }
      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid',
        },
      });
    }

    // Verify the token matches what's stored for this user
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Refresh token is invalid or has been revoked',
        },
      });
    }

    // Issue new access token only (no refresh rotation)
    const { generateAccessToken } = require('../services/token.service');
    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      accessToken,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
};
