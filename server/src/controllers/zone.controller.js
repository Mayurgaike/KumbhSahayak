const { Zone, User } = require('../models');
const logger = require('../config/logger');

/**
 * GET /api/zones
 * Superadmin only: List all zones
 */
async function getZones(req, res, next) {
  try {
    const zones = await Zone.find().populate('zoneAdminId', 'name phone email role');
    return res.status(200).json({ zones });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/zones/:zoneId
 * Superadmin or Zone Admin: Get zone details
 */
async function getZoneById(req, res, next) {
  try {
    const { zoneId } = req.params;
    const zone = await Zone.findById(zoneId).populate('zoneAdminId', 'name phone email role');
    
    if (!zone) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Zone not found' },
      });
    }

    return res.status(200).json({ zone });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/zones
 * Superadmin only: Create a new zone
 */
async function createZone(req, res, next) {
  try {
    const { name, boundary, zoneAdminId, facilities } = req.body;

    // Check if zone with same name exists
    const existingZone = await Zone.findOne({ name });
    if (existingZone) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_NAME', message: 'A zone with this name already exists' },
      });
    }

    // Verify admin exists and is actually an admin
    const admin = await User.findById(zoneAdminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({
        error: { code: 'INVALID_ADMIN', message: 'Provided user ID does not exist or is not an admin' },
      });
    }

    const zone = await Zone.create({
      name,
      boundary,
      zoneAdminId,
      facilities: facilities || [],
    });

    // Back-link admin to the zone
    await User.findByIdAndUpdate(zoneAdminId, { zoneId: zone._id });

    logger.info('Zone created', { zoneId: zone._id, createdBy: req.user.id });

    return res.status(201).json({ zone });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/zones/:zoneId
 * Superadmin only: Update zone properties (name, boundary, admin)
 */
async function updateZone(req, res, next) {
  try {
    const { zoneId } = req.params;
    const { name, boundary, zoneAdminId, facilities } = req.body;

    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Zone not found' },
      });
    }

    // Verify admin exists if changing it
    if (zoneAdminId && zoneAdminId !== String(zone.zoneAdminId)) {
      const admin = await User.findById(zoneAdminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(400).json({
          error: { code: 'INVALID_ADMIN', message: 'Provided user ID does not exist or is not an admin' },
        });
      }
      
      // Clear old admin's zone link
      await User.findByIdAndUpdate(zone.zoneAdminId, { zoneId: null });
      // Link new admin
      await User.findByIdAndUpdate(zoneAdminId, { zoneId: zone._id });
      
      zone.zoneAdminId = zoneAdminId;
    }

    if (name) zone.name = name;
    if (boundary) zone.boundary = boundary;
    if (facilities) zone.facilities = facilities;

    await zone.save();

    logger.info('Zone updated', { zoneId: zone._id, updatedBy: req.user.id });

    return res.status(200).json({ zone });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/zones/:zoneId
 * Superadmin only: Delete a zone
 */
async function deleteZone(req, res, next) {
  try {
    const { zoneId } = req.params;
    
    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Zone not found' },
      });
    }

    // Unlink all users belonging to this zone
    await User.updateMany({ zoneId: zone._id }, { zoneId: null });
    
    await zone.deleteOne();

    logger.info('Zone deleted', { zoneId, deletedBy: req.user.id });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/zones/:zoneId/facilities
 * Superadmin or Zone Admin: Update the facilities array
 */
async function updateFacilities(req, res, next) {
  try {
    const { zoneId } = req.params;
    const { facilities } = req.body;

    const zone = await Zone.findByIdAndUpdate(
      zoneId,
      { facilities },
      { new: true, runValidators: true }
    );

    if (!zone) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Zone not found' },
      });
    }

    logger.info('Zone facilities updated', { zoneId, updatedBy: req.user.id });

    return res.status(200).json({ facilities: zone.facilities });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/zones/:zoneId/hierarchy
 * Superadmin or Zone Admin: Get admin and all volunteers for a zone
 */
async function getHierarchy(req, res, next) {
  try {
    const { zoneId } = req.params;
    
    const zone = await Zone.findById(zoneId).populate('zoneAdminId', 'name phone email role');
    if (!zone) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Zone not found' },
      });
    }

    const volunteers = await User.find({ zoneId, role: 'volunteer' })
      .select('name phone email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      admin: zone.zoneAdminId,
      volunteers,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/zones/status
 * Get the latest density status for all zones
 */
async function getZoneStatuses(req, res, next) {
  try {
    const { CrowdLog } = require('../models');

    // Group by zoneId, sort by timestamp desc, take the first one
    const statuses = await CrowdLog.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$zoneId',
          peopleCount: { $first: '$peopleCount' },
          densityLevel: { $first: '$densityLevel' },
          timestamp: { $first: '$timestamp' },
        },
      },
      {
        $project: {
          _id: 0,
          zoneId: '$_id',
          peopleCount: 1,
          densityLevel: 1,
          timestamp: 1,
        },
      },
    ]);

    return res.status(200).json({ statuses });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getZones,
  getZoneById,
  createZone,
  updateZone,
  deleteZone,
  updateFacilities,
  getHierarchy,
  getZoneStatuses,
};
