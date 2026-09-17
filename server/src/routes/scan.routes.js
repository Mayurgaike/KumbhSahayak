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

// POST /api/scan/:qrCode/verify -> Validate passphrase and reveal PII
router.post('/:qrCode/verify', validate(verifyScanSchema), scanController.verifyScan);

module.exports = router;
