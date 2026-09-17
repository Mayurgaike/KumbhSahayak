const { Router } = require('express');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { raiseSOSSchema } = require('../validators/sos.validators');
const sosController = require('../controllers/sos.controller');

const router = Router();

// All SOS endpoints require authentication
router.use(authenticate);

// Raise an SOS
router.post('/', validate(raiseSOSSchema), sosController.raiseSOS);

// Assign an SOS to responder (Admins / Volunteers only)
router.patch(
  '/:id/assign',
  (req, res, next) => {
    if (['admin', 'volunteer', 'superadmin'].includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only responders can assign SOS' } });
    }
  },
  sosController.assignSOS
);

module.exports = router;
