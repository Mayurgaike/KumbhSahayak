const { LostPersonCase, FamilyMember } = require('../models');
const { getIO } = require('../sockets');
const logger = require('../config/logger');

// Store active timers in memory so we can clear them if confirmed manually
const caseTimers = new Map();

// Configurable auto-expiry timeout (default 30 mins)
const AUTO_EXPIRE_MS = parseFloat(process.env.CASE_AUTO_EXPIRE_MINUTES || '30') * 60 * 1000;

/**
 * POST /api/lost-person-cases
 * Raises a new lost person case.
 */
async function raiseCase(req, res, next) {
  try {
    const { familyMemberId } = req.body;
    const raisedBy = req.user.id;
    let referenceImage = null;

    // 1. Verify family member exists
    const familyMember = await FamilyMember.findById(familyMemberId);
    if (!familyMember) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Family member not found' } });
    }

    // 2. Determine reference image
    if (req.file) {
      referenceImage = `/uploads/${req.file.filename}`;
    } else if (familyMember.photoUrl) {
      referenceImage = familyMember.photoUrl;
    } else {
      return res.status(400).json({ error: { code: 'NO_PHOTO', message: 'A photo is required to raise a face-matching case' } });
    }

    // 3. Create Case
    const lostCase = await LostPersonCase.create({
      familyMemberId,
      raisedBy,
      referenceImage,
    });

    // 4. Emit to AI Service
    const io = getIO();
    io.to('ai-service').emit('start_matching', {
      caseId: lostCase._id,
      referenceImage,
    });

    logger.info('Lost person case raised and matching started', { caseId: lostCase._id });

    return res.status(201).json(lostCase);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/lost-person-cases/:id
 * Confirms a lost person was found.
 */
async function confirmFound(req, res, next) {
  try {
    const { id } = req.params;
    
    const lostCase = await LostPersonCase.findById(id);
    if (!lostCase) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }

    if (lostCase.status !== 'open') {
      return res.status(400).json({ error: { code: 'ALREADY_CLOSED', message: 'Case is not open' } });
    }

    // Update status
    lostCase.status = 'found';
    await lostCase.save();

    // Command AI to stop matching
    const io = getIO();
    io.to('ai-service').emit('stop_matching', { caseId: lostCase._id });

    logger.info('Lost person case manually confirmed found', { caseId: lostCase._id });

    return res.status(200).json(lostCase);
  } catch (err) {
    next(err);
  }
}

async function getCase(req, res, next) {
  try {
    const { id } = req.params;
    const lostCase = await LostPersonCase.findById(id).populate('familyMemberId', 'name age guardianContact');
    if (!lostCase) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }
    return res.status(200).json(lostCase);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  raiseCase,
  confirmFound,
  getCase,
};
