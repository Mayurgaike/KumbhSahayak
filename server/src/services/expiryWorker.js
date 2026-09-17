const { LostPersonCase } = require('../models');
const logger = require('../config/logger');

let expiryInterval;

function startExpiryWorker(io) {
  const EXPIRY_MINUTES = process.env.CASE_EXPIRY_MINUTES || 30;
  
  logger.info(`Starting LostPersonCase expiry worker. Expiry window: ${EXPIRY_MINUTES} minutes.`);

  // Run every minute
  expiryInterval = setInterval(async () => {
    try {
      const expiryThreshold = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);
      
      const expiredCases = await LostPersonCase.find({
        status: 'open',
        createdAt: { $lt: expiryThreshold }
      });

      if (expiredCases.length > 0) {
        logger.info(`Found ${expiredCases.length} expired cases. Marking as expired.`);
        
        for (const caseDoc of expiredCases) {
          caseDoc.status = 'expired';
          await caseDoc.save();
          
          // Emit stop_matching to AI service
          if (io) {
            io.emit('stop_matching', { caseId: caseDoc._id });
          }
        }
      }
    } catch (err) {
      logger.error(`Error in expiry worker: ${err.message}`);
    }
  }, 60 * 1000); // 1 minute
}

function stopExpiryWorker() {
  if (expiryInterval) {
    clearInterval(expiryInterval);
    logger.info('Stopped expiry worker.');
  }
}

module.exports = { startExpiryWorker, stopExpiryWorker };
