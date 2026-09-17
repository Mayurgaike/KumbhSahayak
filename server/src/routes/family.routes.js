const { Router } = require('express');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const upload = require('../config/upload');
const { addFamilyMemberSchema } = require('../validators/family.validators');
const familyController = require('../controllers/family.controller');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/family-members -> List user's registered family members
router.get('/', familyController.getFamilyMembers);

// POST /api/family-members -> Register a new family member (handles optional photo)
// We use upload.single('photo') first, then validate the parsed body, then hit the controller.
router.post(
  '/',
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: { code: 'UPLOAD_ERROR', message: err.message },
        });
      }
      next();
    });
  },
  validate(addFamilyMemberSchema),
  familyController.addFamilyMember
);

// POST /api/family-members/:id/issue-band -> Mark band issued (volunteers/admins/superadmins)
router.post(
  '/:id/issue-band',
  authorize('volunteer', 'admin', 'superadmin'),
  familyController.issueBand
);

// GET /api/family-members/qr/:qrCode -> Get basic details from QR for band issuance
router.get(
  '/qr/:qrCode',
  authorize('volunteer', 'admin', 'superadmin'),
  familyController.getFamilyMemberByQR
);

module.exports = router;
