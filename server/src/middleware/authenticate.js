const { verifyAccessToken } = require('../services/token.service');
const logger = require('../config/logger');

/**
 * Express middleware that verifies the JWT access token from the
 * Authorization header and attaches the decoded payload to req.user.
 *
 * On success: req.user = { id, role, zoneId }
 * On failure: returns 401 with consistent error shape (never a stack trace).
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required — provide a Bearer token',
      },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      zoneId: decoded.zoneId,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired — use refresh token to obtain a new one',
        },
      });
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Access token is invalid',
        },
      });
    }

    logger.error('Unexpected error during token verification', {
      error: err.message,
    });

    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
      },
    });
  }
}

module.exports = authenticate;
