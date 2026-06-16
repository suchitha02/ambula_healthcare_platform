const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true,
    enum: ['General', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Psychiatry', 'ENT', 'Gynecology', 'Gastroenterology']
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  consultationFee: {
    type: Number,
    required: true,
    min: 0
  },
  bio: String,
  experience: Number, // in years
  location: {
    type: String,
    trim: true
  },
  languages: [{
    type: String,
    enum: ['English', 'Hindi', 'Kannada', 'Telugu', 'Tamil']
  }],
  workingHours: {
    startTime: String, // HH:MM format
    endTime: String,
    daysOfWeek: [Number] // 0-6 (Monday-Sunday)
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  profileImage: {
    fileId: mongoose.Schema.Types.ObjectId,
    url: String
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

// Indexes for performance
doctorSchema.index({ specialization: 1, isAvailable: 1 });
doctorSchema.index({ averageRating: -1 });
doctorSchema.index({ location: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
