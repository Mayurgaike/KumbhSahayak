const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_SECRET;

/**
 * Generates a signed, verifiable JWT token representing the digital QR.
 * Does not expire so it remains valid for the duration of the event.
 */
function generateDigitalQR(familyMemberId) {
  if (!ACCESS_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  // Token payload specifies it's a family QR to prevent confusion with user auth tokens
  return jwt.sign(
    {
      type: 'family_qr',
      id: String(familyMemberId),
    },
    ACCESS_SECRET
  );
}

/**
 * Verifies a digital QR token.
 */
function verifyDigitalQR(token) {
  if (!ACCESS_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  const decoded = jwt.verify(token, ACCESS_SECRET);
  if (decoded.type !== 'family_qr') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

module.exports = {
  generateDigitalQR,
  verifyDigitalQR,
};
