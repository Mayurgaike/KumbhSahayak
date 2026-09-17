const { Router } = require('express');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
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

module.exports = router;
