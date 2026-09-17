const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['medical_camp', 'exit', 'help_desk'],
      required: [true, 'Facility type is required'],
    },
    name: {
      type: String,
      required: [true, 'Facility name is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
  },
  {
    _id: true,
  }
);

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      unique: true,
      trim: true,
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    zoneAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Zone admin is required'],
    },
    facilities: [facilitySchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
zoneSchema.index({ boundary: '2dsphere' });
zoneSchema.index({ zoneAdminId: 1 });

const Zone = mongoose.model('Zone', zoneSchema);

module.exports = Zone;
