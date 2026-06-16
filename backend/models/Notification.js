const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['appointment-reminder', 'appointment-confirmed', 'appointment-cancelled', 'prescription-ready', 'lab-report', 'doctor-message', 'waitlist-available', 'payment-status'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: mongoose.Schema.Types.Mixed, // Additional data (appointmentId, etc)
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  readAt: Date,
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 2592000 } // 30 days TTL
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index to automatically remove old notifications after 30 days
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
