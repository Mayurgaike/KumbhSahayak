const { Router } = require('express');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { createVolunteerSchema } = require('../validators/user.validators');
const userController = require('../controllers/user.controller');

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/users/volunteers
router.post(
  '/volunteers',
  authorize('superadmin', 'admin'),
  validate(createVolunteerSchema),
  userController.createVolunteer
);

module.exports = router;
