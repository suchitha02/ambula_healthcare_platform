const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['prescription', 'lab-report', 'scan', 'medical-history', 'vaccine-record'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  file: {
    fileId: mongoose.Schema.Types.ObjectId,
    url: String,
    fileName: String,
    mimeType: String,
    size: Number
  },
  relatedAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  tags: [String],
  visibility: {
    type: String,
    enum: ['private', 'shared-doctors'],
    default: 'private'
  },
  sharedWith: [{
    doctorId: mongoose.Schema.Types.ObjectId,
    sharedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

healthRecordSchema.index({ userId: 1, createdAt: -1 });
healthRecordSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
