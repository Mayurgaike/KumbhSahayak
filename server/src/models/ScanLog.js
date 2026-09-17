const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema(
  {
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyMember',
      required: [true, 'Family member ID is required'],
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Scanned-by user is required'],
    },
    location: {
      type: String,
      required: [true, 'Scan location is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'scanned'],
      default: 'success',
    },
    failureReason: {
      type: String,
      trim: true,
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

// Indexes
scanLogSchema.index({ familyMemberId: 1 });
scanLogSchema.index({ scannedBy: 1 });
scanLogSchema.index({ timestamp: -1 });

const ScanLog = mongoose.model('ScanLog', scanLogSchema);

module.exports = ScanLog;
