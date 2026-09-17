const mongoose = require('mongoose');

const cameraSourceSchema = new mongoose.Schema(
  {
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Zone ID is required'],
    },
    type: {
      type: String,
      enum: ['webcam', 'cctv', 'recorded'],
      required: [true, 'Camera source type is required'],
    },
    sourceUrl: {
      type: String,
      required: [true, 'Source URL is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index
cameraSourceSchema.index({ zoneId: 1 });

const CameraSource = mongoose.model('CameraSource', cameraSourceSchema);

module.exports = CameraSource;
