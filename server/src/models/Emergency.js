const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema(
  {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Raised-by user is required'],
    },
    type: {
      type: String,
      enum: ['medical', 'police', 'mass-incident'],
      required: [true, 'Emergency type is required'],
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone ID is required'],
    },
    status: {
      type: String,
      enum: ['open', 'assigned', 'resolved'],
      default: 'open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
emergencySchema.index({ zoneId: 1 });
emergencySchema.index({ status: 1 });
emergencySchema.index({ type: 1 });

const Emergency = mongoose.model('Emergency', emergencySchema);

module.exports = Emergency;
