/**
 * Express middleware factory that restricts access to specific roles.
 *
 * Must be used AFTER authenticate middleware (requires req.user).
 *
 * Usage: router.get('/admin-route', authenticate, authorize('admin', 'superadmin'), handler)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before authorization',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions for this action',
        },
      });
    }

    next();
  };
}

module.exports = authorize;
