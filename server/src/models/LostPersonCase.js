const mongoose = require('mongoose');

const lostPersonCaseSchema = new mongoose.Schema(
  {
    familyMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyMember',
      required: [true, 'Family member ID is required'],
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Raised-by user is required'],
    },
    referenceImage: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'found'],
      default: 'open',
    },
    matchedZone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      default: null,
    },
    matchedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
lostPersonCaseSchema.index({ status: 1 });
lostPersonCaseSchema.index({ raisedBy: 1 });
lostPersonCaseSchema.index({ familyMemberId: 1 });

const LostPersonCase = mongoose.model('LostPersonCase', lostPersonCaseSchema);

module.exports = LostPersonCase;
