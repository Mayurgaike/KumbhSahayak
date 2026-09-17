const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const analyticsController = require('../controllers/analytics.controller');

const router = Router();

router.use(authenticate);

// GET /api/analytics/crowd
router.get(
  '/crowd',
  authorize('superadmin', 'admin'),
  analyticsController.getCrowdAnalytics
);

module.exports = router;
