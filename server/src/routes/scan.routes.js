const { Router } = require('express');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { verifyScanSchema } = require('../validators/scan.validators');
const scanController = require('../controllers/scan.controller');

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(authorize('volunteer', 'admin', 'superadmin'));

// GET /api/scan/:qrCode -> Get passphrase (authenticator UI)
router.get('/:qrCode', scanController.getScanDetails);

const rateLimit = require('express-rate-limit');

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 failed verify attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts towards the limit
  handler: (req, res) => {
    res.status(429).json({
      error: { code: 'TOO_MANY_REQUESTS', message: 'Too many failed scan attempts. Please try again later.' }
    });
  }
});

// POST /api/scan/:qrCode/verify -> Validate passphrase and reveal PII
router.post('/:qrCode/verify', verifyLimiter, validate(verifyScanSchema), scanController.verifyScan);

module.exports = router;
