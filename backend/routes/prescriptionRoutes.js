const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

/**
 * POST /api/prescriptions
 * Create prescription (doctor only)
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { appointmentId, medicines, diagnosis, tests, followUpDate } = req.body;

    // Verify appointment exists and user is the doctor
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.doctorId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the attending doctor can issue prescriptions'
      });
    }

    // Create prescription number
    const prescriptionNumber = `RX-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;

    // Generate QR code data
    const qrData = {
      prescriptionNumber,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentId,
      issuedAt: new Date()
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    const prescription = new Prescription({
      appointmentId,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      prescriptionNumber,
      medicines,
      diagnosis,
      tests,
      followUpDate,
      qrCode: {
        data: qrCode,
        generatedAt: new Date()
      },
      status: 'issued'
    });

    await prescription.save();

    // Update appointment with prescription
    appointment.consultation.prescriptionId = prescription._id;
    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Prescription issued successfully',
      data: prescription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  }
});

/**
 * GET /api/prescriptions/:prescriptionId
 * Get prescription details
 */
router.get('/:prescriptionId', authMiddleware, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'specialization')
      .populate('appointmentId');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check authorization (patient or doctor)
    if (
      prescription.patientId._id.toString() !== req.userId.toString() &&
      prescription.doctorId._id.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this prescription'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription'
    });
  }
});

/**
 * GET /api/prescriptions/patient/:patientId
 * Get all prescriptions for a patient
 */
router.get('/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    // Only patient or doctor can view
    if (req.userId.toString() !== req.params.patientId.toString()) {
      const doctor = await Doctor.findOne({ userId: req.userId });
      if (!doctor) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized'
        });
      }
    }

    const prescriptions = await Prescription.find({
      patientId: req.params.patientId
    })
      .populate('doctorId', 'specialization')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: prescriptions,
      count: prescriptions.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions'
    });
  }
});

/**
 * GET /api/prescriptions/doctor/:doctorId
 * Get all prescriptions issued by a doctor
 */
router.get('/doctor/:doctorId', authMiddleware, async (req, res) => {
  try {
    // Only the doctor can view their prescriptions
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor || doctor.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const prescriptions = await Prescription.find({
      doctorId: req.params.doctorId
    })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: prescriptions,
      count: prescriptions.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions'
    });
  }
});

/**
 * PUT /api/prescriptions/:prescriptionId
 * Update prescription (doctor only, before status is issued)
 */
router.put('/:prescriptionId', authMiddleware, async (req, res) => {
  try {
    const { medicines, diagnosis, tests, followUpDate } = req.body;

    const prescription = await Prescription.findById(req.params.prescriptionId);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Only issuing doctor can update
    if (prescription.doctorId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the issuing doctor can update'
      });
    }

    // Can only update if not finalized
    if (prescription.status === 'completed' || prescription.status === 'filled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or filled prescriptions'
      });
    }

    if (medicines) prescription.medicines = medicines;
    if (diagnosis) prescription.diagnosis = diagnosis;
    if (tests) prescription.tests = tests;
    if (followUpDate) prescription.followUpDate = followUpDate;

    prescription.updatedAt = new Date();
    await prescription.save();

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: prescription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update prescription'
    });
  }
});

/**
 * POST /api/prescriptions/:prescriptionId/download
 * Generate downloadable PDF prescription
 */
router.get('/:prescriptionId/download', authMiddleware, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'specialization')
      .populate('appointmentId');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check authorization
    if (
      prescription.patientId._id.toString() !== req.userId.toString() &&
      prescription.doctorId.userId.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // For now, return the prescription data
    // PDF generation can be done on frontend with libraries like jsPDF
    res.status(200).json({
      success: true,
      message: 'Prescription data for download',
      data: prescription
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to download prescription'
    });
  }
});

module.exports = router;
