const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema(
  {
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Registered-by user is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
    },
    guardianContact: {
      type: String,
      required: [true, 'Guardian contact is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    digitalQR: {
      type: String,
      required: [true, 'Digital QR code is required'],
    },
    passphrase: {
      type: String,
      required: [true, 'Passphrase is required'],
      select: false,
    },
    physicalBandIssued: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
familyMemberSchema.index({ digitalQR: 1 }, { unique: true });
familyMemberSchema.index({ registeredBy: 1 });

const FamilyMember = mongoose.model('FamilyMember', familyMemberSchema);

module.exports = FamilyMember;
