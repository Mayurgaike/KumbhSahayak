const { Router } = require('express');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const zoneScopeGuard = require('../middleware/zoneScopeGuard');
const { createZoneSchema, updateZoneSchema, updateFacilitiesSchema } = require('../validators/zone.validators');
const zoneController = require('../controllers/zone.controller');

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/zones
router.get('/', authorize('superadmin'), zoneController.getZones);

// POST /api/zones
router.post('/', authorize('superadmin'), validate(createZoneSchema), zoneController.createZone);

// GET /api/zones/status
router.get('/status', authorize('superadmin', 'admin', 'volunteer', 'visitor'), zoneController.getZoneStatuses);

// GET /api/zones/:zoneId
router.get('/:zoneId', authorize('superadmin', 'admin'), zoneScopeGuard, zoneController.getZoneById);

// PUT /api/zones/:zoneId
router.put('/:zoneId', authorize('superadmin'), validate(updateZoneSchema), zoneController.updateZone);

// DELETE /api/zones/:zoneId
router.delete('/:zoneId', authorize('superadmin'), zoneController.deleteZone);

// PUT /api/zones/:zoneId/facilities
router.put('/:zoneId/facilities', authorize('superadmin', 'admin'), zoneScopeGuard, validate(updateFacilitiesSchema), zoneController.updateFacilities);

// GET /api/zones/:zoneId/hierarchy
router.get('/:zoneId/hierarchy', authorize('superadmin', 'admin'), zoneScopeGuard, zoneController.getHierarchy);

module.exports = router;
