const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot of the details entered at booking time (Name, Age, Phone).
  // Lets one account book on behalf of a family member while keeping
  // the doctor's view accurate for that specific appointment.
  patientDetails: {
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    phone: { type: String, required: true }
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true
  },
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled'
  },
  consultationType: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },
  consultationLink: String, // For online appointments
  notes: String,
  consultation: {
    diagnosis: String,
    notes: String,
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    followUpDate: Date
  },
  payment: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    changedBy: mongoose.Schema.Types.ObjectId,
    reason: String
  }],
  reminderSent: {
    type: Boolean,
    default: false
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

// CRITICAL: Indexes for queries and sorting
appointmentSchema.index({ patientId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, createdAt: -1 });
appointmentSchema.index({ status: 1, createdAt: -1 });
appointmentSchema.index({ slotId: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
