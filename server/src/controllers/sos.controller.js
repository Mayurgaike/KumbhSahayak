const { Emergency, Zone, User } = require('../models');
const { getIO } = require('../sockets');
const logger = require('../config/logger');
const { sendSOSAlert } = require('../services/twilioClient');

/**
 * POST /api/sos
 * Raises a new emergency.
 */
async function raiseSOS(req, res, next) {
  try {
    const { type, zoneId } = req.body;
    const raisedBy = req.user.id;
    const userRole = req.user.role;

    // 1. Verify mass-incident restrictions
    if (type === 'mass-incident' && userRole === 'visitor') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Visitors cannot raise mass-incident SOS' } });
    }

    // 2. Verify zone exists
    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Zone not found' } });
    }

    // 3. Create Emergency
    const sos = await Emergency.create({
      raisedBy,
      type,
      zoneId,
    });

    const io = getIO();
    const payload = {
      sosId: sos._id,
      type,
      zoneId,
      timestamp: sos.createdAt,
      status: sos.status
    };

    // 4. Routing and Twilio Alerting
    if (type === 'mass-incident') {
      // Mass-incident skips normal routing: goes to ALL zone admins + superadmins
      io.to(`admin:zone_${zoneId}`).emit('sos:new', payload);
      io.to('superadmin').emit('sos:new', payload);

      // Fetch superadmins to send Twilio alerts
      const superadmins = await User.find({ role: 'superadmin' }).select('phone');
      superadmins.forEach(sa => sendSOSAlert(sa.phone, type, zone.name));
      
    } else {
      // Standard SOS: routes to type-specific admin
      const targetRoom = `admin:zone_${zoneId}:${type}`;
      io.to(targetRoom).emit('sos:new', payload);

      // Fetch specific admins for Twilio alerts
      const targetedAdmins = await User.find({ role: 'admin', zoneId, department: type }).select('phone');
      targetedAdmins.forEach(admin => sendSOSAlert(admin.phone, type, zone.name));
    }

    logger.info('SOS Raised and routed', { sosId: sos._id, type, zoneId });

    return res.status(201).json(sos);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/sos/:id/assign
 * Assigns an emergency to a responder.
 */
async function assignSOS(req, res, next) {
  try {
    const { id } = req.params;
    const assignedTo = req.user.id;

    const sos = await Emergency.findById(id);
    if (!sos) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Emergency not found' } });
    }

    if (sos.status !== 'open') {
      return res.status(400).json({ error: { code: 'NOT_OPEN', message: 'Emergency is not open' } });
    }

    sos.status = 'assigned';
    sos.assignedTo = assignedTo;
    await sos.save();

    logger.info('SOS assigned', { sosId: sos._id, assignedTo });

    return res.status(200).json(sos);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  raiseSOS,
  assignSOS
};
