const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // HH:MM format
    required: true
  },
  endTime: {
    type: String, // HH:MM format
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'locked', 'blocked'],
    default: 'available'
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  consultationType: {
    type: String,
    enum: ['online', 'offline', 'both'],
    default: 'both'
  },
  maxPatients: {
    type: Number,
    default: 1
  },
  bookedCount: {
    type: Number,
    default: 0
  },
  lockTimestamp: Date, // For preventing race conditions
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// CRITICAL: Compound index for booking queries
slotSchema.index({ doctorId: 1, date: 1, status: 1 });
slotSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Slot', slotSchema);
