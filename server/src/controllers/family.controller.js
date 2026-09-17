const mongoose = require('mongoose');
const { FamilyMember } = require('../models');
const { generateDigitalQR } = require('../services/qr.service');
const logger = require('../config/logger');

/**
 * GET /api/family-members
 * Retrieves all family members registered by the current user.
 */
async function getFamilyMembers(req, res, next) {
  try {
    const familyMembers = await FamilyMember.find({ registeredBy: req.user.id })
      .sort({ createdAt: -1 });
    
    return res.status(200).json({ familyMembers });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/family-members
 * Adds a new family member, generating a digital QR code synchronously.
 * Handles optional photo uploads (multipart/form-data).
 */
async function addFamilyMember(req, res, next) {
  try {
    const { name, age, guardianContact, address, passphrase } = req.body;
    let photoUrl = null;

    if (req.file) {
      // Create a URL path relative to the server origin (or proxy)
      photoUrl = `/uploads/${req.file.filename}`;
    }

    // Generate an ObjectId so we can encode it into the digital QR
    const familyMemberId = new mongoose.Types.ObjectId();
    const digitalQR = generateDigitalQR(familyMemberId);

    const familyMember = await FamilyMember.create({
      _id: familyMemberId,
      registeredBy: req.user.id,
      name,
      age,
      guardianContact,
      address,
      passphrase, // Stored in plaintext for volunteer to read visually, guarded by select:false
      photoUrl,
      digitalQR,
    });

    logger.info('Family member registered', { 
      familyMemberId: familyMember._id, 
      registeredBy: req.user.id 
    });

    // We MUST remove the passphrase from the returned object
    const returnedMember = familyMember.toObject();
    delete returnedMember.passphrase;

    return res.status(201).json({ familyMember: returnedMember });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/family-members/:id/issue-band
 * Volunteer/Admin/Superadmin only: Mark the physical band as issued.
 */
async function issueBand(req, res, next) {
  try {
    const { id } = req.params;

    const familyMember = await FamilyMember.findById(id);
    if (!familyMember) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Family member not found' },
      });
    }

    if (familyMember.physicalBandIssued) {
      return res.status(400).json({
        error: { code: 'ALREADY_ISSUED', message: 'Physical band has already been issued' },
      });
    }

    familyMember.physicalBandIssued = true;
    await familyMember.save();

    logger.info('Physical band issued', {
      familyMemberId: id,
      issuedBy: req.user.id,
    });

    return res.status(200).json({
      message: 'Physical band marked as issued',
      physicalBandIssued: true,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFamilyMembers,
  addFamilyMember,
  issueBand,
};
