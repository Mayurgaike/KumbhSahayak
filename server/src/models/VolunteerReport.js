const mongoose = require('mongoose');

const volunteerReportSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Volunteer ID is required'],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reported-by user is required'],
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'warned', 'deactivated'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
volunteerReportSchema.index({ volunteerId: 1 });
volunteerReportSchema.index({ status: 1 });

const VolunteerReport = mongoose.model('VolunteerReport', volunteerReportSchema);

module.exports = VolunteerReport;
