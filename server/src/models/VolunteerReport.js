const mongoose = require('mongoose');

const volunteerReportSchema = new mongoose.Schema(
  {
    reportedVolunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reported volunteer ID is required'],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null if submitted anonymously by public
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['open', 'warned', 'resolved'],
      default: 'open',
    },
    adminNotes: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

volunteerReportSchema.index({ reportedVolunteerId: 1 });
volunteerReportSchema.index({ status: 1 });

const VolunteerReport = mongoose.model('VolunteerReport', volunteerReportSchema);

module.exports = VolunteerReport;
