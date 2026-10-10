const { Router } = require('express');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { raiseCaseSchema } = require('../validators/case.validators');
const caseController = require('../controllers/case.controller');
const upload = require('../config/upload');

const router = Router();

router.use(authenticate);

// Raise a case (requires authenticated user)
router.post(
  '/',
  upload.single('photo'),
  validate(raiseCaseSchema),
  caseController.raiseCase
);

// Confirm a case as found
router.patch('/:id', caseController.confirmFound);

// Get all cases (Admin/Volunteer)
router.get('/', authorize('superadmin', 'admin', 'volunteer'), caseController.getAllCases);

// Get cases raised by current user
router.get('/my-cases', authorize('visitor', 'superadmin', 'admin', 'volunteer'), caseController.getMyCases);

// Get a case by ID
router.get('/:id', caseController.getCase);

module.exports = router;
