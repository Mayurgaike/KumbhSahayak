const { Router } = require('express');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { createVolunteerSchema } = require('../validators/volunteer.validators');
const volunteerController = require('../controllers/volunteer.controller');

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/volunteers — Admin/Superadmin only
router.post(
  '/', 
  authorize('admin', 'superadmin'), 
  validate(createVolunteerSchema), 
  volunteerController.createVolunteer
);

// GET /api/volunteers/tasks — Volunteer only
router.get(
  '/tasks', 
  authorize('volunteer'), 
  volunteerController.getTasks
);

// POST /api/volunteers/:id/report — Anyone can report
router.post(
  '/:id/report',
  volunteerController.reportVolunteer
);

// PATCH /api/volunteers/reports/:reportId — Admin/Superadmin
router.patch(
  '/reports/:reportId',
  authorize('admin', 'superadmin'),
  volunteerController.updateReport
);

// PATCH /api/volunteers/:id/deactivate — Admin/Superadmin
router.patch(
  '/:id/deactivate',
  authorize('admin', 'superadmin'),
  volunteerController.deactivateVolunteer
);

module.exports = router;
