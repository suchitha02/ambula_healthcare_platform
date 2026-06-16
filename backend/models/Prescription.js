const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  medicines: [{
    name: {
      type: String,
      required: true
    },
    dosage: String, // e.g., "500mg"
    frequency: String, // e.g., "Twice daily"
    duration: String, // e.g., "7 days"
    instructions: String,
    side_effects: String
  }],
  diagnosis: {
    type: String,
    required: true
  },
  tests: [{
    name: String,
    purpose: String
  }],
  followUpDate: Date,
  attachments: [{
    fileId: mongoose.Schema.Types.ObjectId,
    url: String,
    type: String, // PDF, image, etc.
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  qrCode: {
    data: String, // QR code as data URL
    generatedAt: Date
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'filled', 'completed'],
    default: 'issued'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
