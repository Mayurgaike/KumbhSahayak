const { Router } = require('express');

const router = Router();

// GET /api/health — ops health check, no auth required
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
