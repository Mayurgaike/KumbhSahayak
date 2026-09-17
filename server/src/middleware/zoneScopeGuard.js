/**
 * Express middleware that enforces zone-level access control.
 *
 * - superadmin: passes through (sees all zones)
 * - admin: can only access data for their own zone
 * - other roles: passes through (zone-scoping doesn't apply to visitors/volunteers
 *   at this middleware level — route-level guards handle their access separately)
 *
 * The zone ID is read from, in priority order:
 *   1. req.params.zoneId
 *   2. req.body.zoneId
 *   3. req.query.zoneId
 *
 * Must be used AFTER authenticate middleware (requires req.user).
 *
 * Usage: router.get('/zones/:zoneId/data', authenticate, authorize('admin', 'superadmin'), zoneScopeGuard, handler)
 */
function zoneScopeGuard(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required before zone-scope check',
      },
    });
  }

  // Superadmin sees all zones
  if (req.user.role === 'superadmin') {
    return next();
  }

  // For admin: enforce zone match
  if (req.user.role === 'admin') {
    const requestedZoneId =
      req.params.zoneId || req.body.zoneId || req.query.zoneId;

    if (requestedZoneId && requestedZoneId !== String(req.user.zoneId)) {
      return res.status(403).json({
        error: {
          code: 'ZONE_ACCESS_DENIED',
          message: 'Admin access is restricted to your assigned zone',
        },
      });
    }
  }

  next();
}

module.exports = zoneScopeGuard;
