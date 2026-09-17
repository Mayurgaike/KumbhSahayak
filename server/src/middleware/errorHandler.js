const logger = require('../config/logger');

/**
 * Central Express error-handling middleware.
 *
 * Catches all errors that reach it and returns a consistent JSON shape:
 *   { error: { code, message } }
 *
 * Handles:
 *   - Mongoose ValidationError → 400
 *   - Mongoose duplicate key (code 11000) → 409
 *   - Mongoose CastError (bad ObjectId) → 400
 *   - SyntaxError from JSON.parse (malformed body) → 400
 *   - Any error with a statusCode property → that status
 *   - Everything else → 500
 *
 * Never leaks stack traces in production.
 */
function errorHandler(err, req, res, _next) {
  // Log the full error internally
  logger.error('Unhandled error', {
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        details,
      },
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'unknown';
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: `A record with this ${field} already exists`,
      },
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: `Invalid ${err.path}: ${err.value}`,
      },
    });
  }

  // Malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'MALFORMED_JSON',
        message: 'Request body contains invalid JSON',
      },
    });
  }

  // Errors with explicit status codes (thrown by controllers)
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'An unexpected error occurred';

  return res.status(statusCode).json({
    error: { code, message },
  });
}

module.exports = errorHandler;
