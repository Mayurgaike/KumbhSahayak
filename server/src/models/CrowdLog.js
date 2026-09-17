const mongoose = require('mongoose');

const crowdLogSchema = new mongoose.Schema(
  {
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone ID is required'],
    },
    peopleCount: {
      type: Number,
      required: [true, 'People count is required'],
      min: [0, 'People count cannot be negative'],
    },
    densityLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: [true, 'Density level is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index — query pattern: "crowd data for zone X in time range"
crowdLogSchema.index({ zoneId: 1, timestamp: -1 });

const CrowdLog = mongoose.model('CrowdLog', crowdLogSchema);

module.exports = CrowdLog;
