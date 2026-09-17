const bcrypt = require('bcryptjs');
const { User, Emergency, LostPersonCase, Zone } = require('../models');
const logger = require('../config/logger');

const SALT_ROUNDS = 10;

/**
 * POST /api/volunteers
 * Admin-only: Create a new volunteer and assign them to a zone.
 */
async function createVolunteer(req, res, next) {
  try {
    const { name, phone, password, zoneId } = req.body;

    // 1. Verify zone exists
    const zone = await Zone.findById(zoneId);
    if (!zone) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Zone not found' } });
    }

    // 2. Check duplicate phone
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ error: { code: 'DUPLICATE_PHONE', message: 'Phone number already registered' } });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Create explicitly as volunteer
    const volunteer = await User.create({
      role: 'volunteer',
      name,
      phone,
      passwordHash,
      zoneId,
    });

    logger.info('Volunteer created securely by admin', { volunteerId: volunteer._id, createdBy: req.user.id });

    return res.status(201).json({
      volunteer: {
        id: volunteer._id,
        name: volunteer.name,
        phone: volunteer.phone,
        role: volunteer.role,
        zoneId: volunteer.zoneId,
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/volunteers/tasks
 * Volunteer-only: Fetch all active SOS and Lost Person cases relevant to them.
 */
async function getTasks(req, res, next) {
  try {
    const volunteerId = req.user.id;
    const zoneId = req.user.zoneId;

    // 1. SOS Cases explicitly assigned to this volunteer that are not resolved
    const sosCases = await Emergency.find({ 
      assignedTo: volunteerId,
      status: { $ne: 'resolved' } 
    }).sort({ createdAt: -1 });

    // 2. Lost Person Cases that were matched to the volunteer's assigned zone
    const lostPersonCases = await LostPersonCase.find({
      matchedZone: zoneId,
      status: 'open'
    }).populate('familyMemberId', 'name age gender')
      .sort({ matchedAt: -1 });

    return res.status(200).json({
      sosCases,
      lostPersonCases
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/volunteers/:id/report
 * Any authenticated user (including visitors): Report a volunteer for misconduct
 */
async function reportVolunteer(req, res, next) {
  try {
    const { id } = req.params; // reportedVolunteerId
    const { description } = req.body;
    const reportedBy = req.user.id;

    const { VolunteerReport } = require('../models');

    const report = await VolunteerReport.create({
      reportedVolunteerId: id,
      reportedBy,
      description
    });

    logger.info('Volunteer misconduct reported', { reportId: report._id, reportedVolunteerId: id });

    return res.status(201).json({ report });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/volunteers/reports/:reportId
 * Admin/Superadmin: Resolve or warn a volunteer report
 */
async function updateReport(req, res, next) {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;

    const { VolunteerReport } = require('../models');

    const report = await VolunteerReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } });
    }

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;

    await report.save();

    logger.info('Volunteer report updated', { reportId: report._id, status });

    return res.status(200).json({ report });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/volunteers/:id/deactivate
 * Admin/Superadmin: Deactivate a volunteer account
 */
async function deactivateVolunteer(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    user.isActive = false;
    await user.save();

    logger.warn('Volunteer account deactivated', { volunteerId: user._id, deactivatedBy: req.user.id });

    return res.status(200).json({ message: 'Account successfully deactivated', user: { id: user._id, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createVolunteer,
  getTasks,
  reportVolunteer,
  updateReport,
  deactivateVolunteer
};
