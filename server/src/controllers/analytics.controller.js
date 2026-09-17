const { CrowdLog } = require('../models');
const logger = require('../config/logger');

/**
 * GET /api/analytics/crowd
 * Superadmin / Admin only
 * Returns historical crowd densities grouped by hour for the last 24 hours.
 */
async function getCrowdAnalytics(req, res, next) {
  try {
    const { zoneId } = req.query;

    // Time boundary: last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const matchStage = {
      timestamp: { $gte: oneDayAgo }
    };
    if (zoneId) {
      const mongoose = require('mongoose');
      if (mongoose.isValidObjectId(zoneId)) {
         matchStage.zoneId = new mongoose.Types.ObjectId(zoneId);
      }
    }

    // Group logs by hour and zone to compute average density
    const analytics = await CrowdLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            zoneId: '$zoneId',
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
            hour: { $hour: '$timestamp' }
          },
          avgPeopleCount: { $avg: '$peopleCount' }
        }
      },
      {
        $project: {
          _id: 0,
          zoneId: '$_id.zoneId',
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
              hour: '$_id.hour'
            }
          },
          avgPeopleCount: { $round: ['$avgPeopleCount', 0] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.status(200).json({ analytics });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCrowdAnalytics
};
