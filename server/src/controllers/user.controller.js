const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../config/logger');

const SALT_ROUNDS = 10;

/**
 * POST /api/users/volunteers
 * Superadmin or Zone Admin: Create a volunteer
 */
async function createVolunteer(req, res, next) {
  try {
    const { name, phone, email, password } = req.body;
    let { zoneId } = req.body;

    // For Zone Admin, always lock volunteer to their own zone regardless of payload
    if (req.user.role === 'admin') {
      zoneId = req.user.zoneId;
    }

    // Superadmins must explicitly provide a zoneId
    if (req.user.role === 'superadmin' && !zoneId) {
      return res.status(400).json({
        error: { code: 'MISSING_ZONE', message: 'Superadmins must provide a zoneId when creating a volunteer' },
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_PHONE',
          message: 'An account with this phone number already exists',
        },
      });
    }

    // Hash password — never log or return the hash
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with role hardcoded to 'volunteer'
    const volunteer = await User.create({
      role: 'volunteer',
      name,
      phone,
      email: email || undefined,
      passwordHash,
      zoneId,
    });

    logger.info('Volunteer created', { userId: volunteer._id, createdBy: req.user.id, zoneId });

    return res.status(201).json({
      user: {
        id: volunteer._id,
        name: volunteer.name,
        phone: volunteer.phone,
        email: volunteer.email || null,
        role: volunteer.role,
        zoneId: volunteer.zoneId,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createVolunteer,
};
