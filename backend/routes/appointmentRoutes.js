const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const BookingService = require("../services/bookingService");
const Appointment = require("../models/Appointment");

const router = express.Router();

/** POST /api/appointments/book */
router.post("/book", authMiddleware, async (req, res) => {
  try {
    const { slotId, doctorId, consultationType, patientDetails } = req.body;
    if (!slotId || !doctorId || !consultationType)
      return res.status(400).json({ success: false, message: "slotId, doctorId, consultationType are required" });

    if (!patientDetails || !patientDetails.name || !patientDetails.age || !patientDetails.phone)
      return res.status(400).json({ success: false, message: "Patient name, age, and phone number are required" });

    const age = Number(patientDetails.age);
    if (Number.isNaN(age) || age < 0 || age > 120)
      return res.status(400).json({ success: false, message: "Please enter a valid age" });

    const result = await BookingService.bookAppointment(slotId, req.userId, doctorId, consultationType, {
      name: String(patientDetails.name).trim(),
      age,
      phone: String(patientDetails.phone).trim(),
    });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/** GET /api/appointments/my-appointments */
router.get("/my-appointments", authMiddleware, async (req, res) => {
  try {
    const result = await BookingService.getPatientAppointments(req.userId, req.query.status || null);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/appointments/:appointmentId */
router.get("/:appointmentId", authMiddleware, async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.appointmentId)
      .populate("doctorId", "specialization consultationFee")
      .populate("slotId", "date startTime endTime")
      .populate("patientId", "name email phone");

    if (!apt) return res.status(404).json({ success: false, message: "Appointment not found" });
    if (apt.patientId._id.toString() !== req.userId && apt.doctorId._id.toString() !== req.userId)
      return res.status(403).json({ success: false, message: "Unauthorised" });

    res.json({ success: true, data: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch appointment" });
  }
});

/** POST /api/appointments/:appointmentId/cancel */
router.post("/:appointmentId/cancel", authMiddleware, async (req, res) => {
  try {
    const result = await BookingService.cancelAppointment(req.params.appointmentId, req.userId, req.body.reason || "");
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/** POST /api/appointments/:appointmentId/reschedule */
router.post("/:appointmentId/reschedule", authMiddleware, async (req, res) => {
  try {
    const { newSlotId } = req.body;
    if (!newSlotId) return res.status(400).json({ success: false, message: "newSlotId is required" });
    const result = await BookingService.rescheduleAppointment(req.params.appointmentId, newSlotId, req.userId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/appointments/:appointmentId/status
 * Progress appointment: scheduled → checked-in → consulting → completed
 * Doctor only.
 */
router.put("/:appointmentId/status", authMiddleware, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validTransitions = {
      scheduled: ["checked-in", "cancelled"],
      "checked-in": ["consulting", "cancelled"],
      consulting: ["completed"],
    };

    const apt = await Appointment.findById(req.params.appointmentId);
    if (!apt) return res.status(404).json({ success: false, message: "Appointment not found" });
    if (apt.doctorId.toString() !== req.userId) return res.status(403).json({ success: false, message: "Doctors only" });

    const allowed = validTransitions[apt.status] || [];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `Cannot transition from ${apt.status} to ${status}` });

    apt.status = status;
    apt.statusHistory.push({ status, timestamp: new Date(), changedBy: req.userId, reason: reason || "" });
    await apt.save();

    // Emit status change
    try {
      const { appointmentNS } = require("../server");
      appointmentNS.to(`appointment-${apt._id}`).emit("appointment-status", { appointmentId: apt._id, status });
    } catch (_) {}

    res.json({ success: true, message: `Status updated to ${status}`, data: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

/** PUT /api/appointments/:appointmentId/update-consultation */
router.put("/:appointmentId/update-consultation", authMiddleware, async (req, res) => {
  try {
    const { diagnosis, notes, prescriptionId, followUpDate } = req.body;
    const apt = await Appointment.findById(req.params.appointmentId);
    if (!apt) return res.status(404).json({ success: false, message: "Appointment not found" });
    if (apt.doctorId.toString() !== req.userId) return res.status(403).json({ success: false, message: "Doctors only" });

    apt.consultation = { diagnosis, notes, prescriptionId, followUpDate };
    apt.status = "completed";
    apt.statusHistory.push({ status: "completed", timestamp: new Date(), changedBy: req.userId, reason: "Consultation completed" });
    await apt.save();

    res.json({ success: true, message: "Consultation notes saved", data: apt });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update consultation" });
  }
});

module.exports = router;
