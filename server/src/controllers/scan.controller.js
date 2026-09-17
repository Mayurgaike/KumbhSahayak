const { FamilyMember, ScanLog } = require('../models');
const { verifyDigitalQR } = require('../services/qr.service');
const logger = require('../config/logger');

// In-memory rate limiter: Map<familyMemberId, { count: number, lockUntil: number }>
// For a production app, use Redis. For MVP, an in-memory map is sufficient.
const failedAttemptsMap = new Map();
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Helper to check rate limit for a given family member ID.
 * Returns true if locked.
 */
function isRateLimited(familyMemberId) {
  const record = failedAttemptsMap.get(familyMemberId);
  if (!record) return false;

  if (record.count >= MAX_FAILURES) {
    if (Date.now() < record.lockUntil) {
      return true; // Still locked
    }
    // Lock expired, reset
    failedAttemptsMap.delete(familyMemberId);
    return false;
  }
  return false;
}

/**
 * Helper to record a failure.
 */
function recordFailure(familyMemberId) {
  const record = failedAttemptsMap.get(familyMemberId) || { count: 0, lockUntil: 0 };
  record.count += 1;
  
  if (record.count >= MAX_FAILURES) {
    record.lockUntil = Date.now() + LOCKOUT_MS;
    logger.warn('Rate limit triggered for brute force verify', { familyMemberId });
  }
  
  failedAttemptsMap.set(familyMemberId, record);
}

/**
 * Helper to clear failures on success.
 */
function clearFailures(familyMemberId) {
  failedAttemptsMap.delete(familyMemberId);
}

/**
 * GET /api/scan/:qrCode
 * Required role: volunteer, admin, superadmin
 * Does NOT return PII, only returns the passphrase so the volunteer can verify with the child.
 */
async function getScanDetails(req, res, next) {
  try {
    const { qrCode } = req.params;
    
    let decoded;
    try {
      decoded = verifyDigitalQR(qrCode);
    } catch (err) {
      return res.status(400).json({ error: { code: 'INVALID_QR', message: 'The provided QR code is invalid' } });
    }

    // Must fetch passphrase explicitly as it's select: false
    const familyMember = await FamilyMember.findById(decoded.id).select('+passphrase');
    if (!familyMember) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Family member not found' } });
    }

    // Do NOT write a ScanLog here, because we don't have location data. 
    // The formal scan log is written during /verify.

    // Return ONLY the passphrase, nothing else.
    return res.status(200).json({
      passphrase: familyMember.passphrase,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/scan/:qrCode/verify
 * Required role: volunteer, admin, superadmin
 * Validates the passphrase against the QR code.
 */
async function verifyScan(req, res, next) {
  try {
    const { qrCode } = req.params;
    const { passphrase, location } = req.body;
    const scannedBy = req.user.id;

    let decoded;
    try {
      decoded = verifyDigitalQR(qrCode);
    } catch (err) {
      return res.status(400).json({ error: { code: 'INVALID_QR', message: 'The provided QR code is invalid' } });
    }

    const familyMemberId = decoded.id;

    // Check rate limit
    if (isRateLimited(familyMemberId)) {
      return res.status(429).json({
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many failed verification attempts. Please try again later.' },
      });
    }

    const familyMember = await FamilyMember.findById(familyMemberId).select('+passphrase');
    if (!familyMember) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Family member not found' } });
    }

    // Check passphrase
    if (familyMember.passphrase !== passphrase) {
      recordFailure(familyMemberId);
      
      // Log the failed attempt
      await ScanLog.create({
        familyMemberId,
        scannedBy,
        location,
        status: 'failed',
        failureReason: 'Invalid passphrase',
      });

      return res.status(401).json({
        error: { code: 'INVALID_PASSPHRASE', message: 'The provided passphrase is incorrect' },
      });
    }

    // Success! Clear failures and log the successful scan
    clearFailures(familyMemberId);
    await ScanLog.create({
      familyMemberId,
      scannedBy,
      location,
      status: 'success',
    });

    logger.info('QR scanned and verified successfully', { familyMemberId, scannedBy, location });

    // Return the PII
    return res.status(200).json({
      name: familyMember.name,
      guardianContact: familyMember.guardianContact,
      address: familyMember.address,
      photoUrl: familyMember.photoUrl,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getScanDetails,
  verifyScan,
};
