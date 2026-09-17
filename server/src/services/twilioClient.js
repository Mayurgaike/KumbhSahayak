const twilio = require('twilio');
const logger = require('../config/logger');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Initialize client only if credentials exist
let client = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
} else {
  logger.warn('Twilio credentials missing. SMS and Voice alerts will be mocked.');
}

/**
 * Sends a high-priority SMS and Voice call to the specified phone number.
 */
async function sendSOSAlert(toPhone, emergencyType, zoneName) {
  const messageBody = `CRITICAL ALERT: New ${emergencyType.toUpperCase()} emergency reported in Zone: ${zoneName}. Please check your Kumbh Mela Safety Dashboard immediately.`;
  
  if (!client) {
    logger.info('[MOCK TWILIO] Dispatching SOS Alerts', { toPhone, emergencyType, zoneName, messageBody });
    return;
  }

  try {
    // 1. Send SMS
    const sms = await client.messages.create({
      body: messageBody,
      from: TWILIO_PHONE_NUMBER,
      to: toPhone
    });
    logger.info('Twilio SMS dispatched', { sid: sms.sid, toPhone });

    // 2. Initiate Voice Call with TwiML
    const twiml = `<Response><Say voice="alice">${messageBody}</Say></Response>`;
    const call = await client.calls.create({
      twiml: twiml,
      to: toPhone,
      from: TWILIO_PHONE_NUMBER
    });
    logger.info('Twilio Voice Call dispatched', { sid: call.sid, toPhone });
    
  } catch (error) {
    logger.error('Twilio alert failed', { error: error.message, toPhone });
  }
}

module.exports = {
  sendSOSAlert
};
