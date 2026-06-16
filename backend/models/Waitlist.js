const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
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
  position: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'booked', 'expired', 'cancelled'],
    default: 'waiting'
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 604800 } // 7 days TTL
  },
  notificationSentAt: Date,
  bookingIdIfAccepted: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }
});

// TTL index to automatically remove expired waitlist entries after 7 days
waitlistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Waitlist', waitlistSchema);
