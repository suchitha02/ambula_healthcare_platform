const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Doctor = require("../models/Doctor");
const Slot = require("../models/Slot");
const BookingService = require("../services/bookingService");

const router = express.Router();

// ─────────────────────────────────────────────────
// FIX: /me/* routes MUST come before /:doctorId
// otherwise Express matches "me" as a doctorId param
// ─────────────────────────────────────────────────

/** GET /api/doctors/me/profile */
router.get("/me/profile", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.userId }).populate("userId", "name email phone");
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch doctor profile" });
  }
});

/** PUT /api/doctors/me/profile */
router.put("/me/profile", authMiddleware, async (req, res) => {
  try {
    const { specialization, qualifications, consultationFee, bio, experience, languages, workingHours, isAvailable, location } = req.body;
    const doctor = await Doctor.findOne({ userId: req.userId });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });

    if (specialization !== undefined) doctor.specialization = specialization;
    if (qualifications !== undefined) doctor.qualifications = qualifications;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (bio !== undefined) doctor.bio = bio;
    if (experience !== undefined) doctor.experience = experience;
    if (languages !== undefined) doctor.languages = languages;
    if (workingHours !== undefined) doctor.workingHours = workingHours;
    if (isAvailable !== undefined) doctor.isAvailable = isAvailable;
    if (location !== undefined) doctor.location = location;
    doctor.updatedAt = new Date();

    await doctor.save();
    res.json({ success: true, message: "Doctor profile updated", data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

/** GET /api/doctors/me/appointments */
router.get("/me/appointments", authMiddleware, async (req, res) => {
  try {
    const { status, date } = req.query;
    const doctor = await Doctor.findOne({ userId: req.userId });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });

    const result = await BookingService.getDoctorAppointments(doctor._id, status || null, date || null);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch appointments" });
  }
});

/** POST /api/doctors/me/slots — with duplicate guard */
router.post("/me/slots", authMiddleware, async (req, res) => {
  try {
    const { date, slots } = req.body;
    if (!date || !Array.isArray(slots) || slots.length === 0)
      return res.status(400).json({ success: false, message: "Date and slots array are required" });

    const doctor = await Doctor.findOne({ userId: req.userId });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });

    const created = [];
    const skipped = [];

    for (const slot of slots) {
      // FIX: prevent duplicate slots
      const existing = await Slot.findOne({
        doctorId: doctor._id,
        date: new Date(date),
        startTime: slot.startTime,
      });

      if (existing) {
        skipped.push(slot.startTime);
        continue;
      }

      const newSlot = await Slot.create({
        doctorId: doctor._id,
        date: new Date(date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        consultationType: slot.consultationType || "both",
        status: "available",
      });
      created.push(newSlot);
    }

    res.status(201).json({
      success: true,
      message: `${created.length} slot(s) created${skipped.length ? `, ${skipped.length} duplicate(s) skipped` : ""}`,
      data: created,
      skipped,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create slots", error: err.message });
  }
});

/** PUT /api/doctors/me/slots/:slotId/block — block a slot for holiday/leave */
router.put("/me/slots/:slotId/block", authMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.userId });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });

    const slot = await Slot.findOne({ _id: req.params.slotId, doctorId: doctor._id });
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
    if (slot.status === "booked") return res.status(400).json({ success: false, message: "Cannot block an already booked slot" });

    slot.status = "blocked";
    await slot.save();

    res.json({ success: true, message: "Slot blocked successfully", data: slot });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to block slot" });
  }
});

/** POST /api/doctors/me/slots/block-range — bulk block slots for date range */
router.post("/me/slots/block-range", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason)
      return res.status(400).json({ success: false, message: "startDate, endDate, and reason are required" });

    const doctor = await Doctor.findOne({ userId: req.userId });
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return res.status(400).json({ success: false, message: "startDate must be before endDate" });

    // Find all slots in the date range that are not booked
    const slots = await Slot.find({
      doctorId: doctor._id,
      date: { $gte: start, $lte: end },
      status: { $ne: "booked" },
    });

    if (slots.length === 0) {
      return res.status(404).json({ success: false, message: "No available slots found in the specified date range" });
    }

    // Block all found slots
    const result = await Slot.updateMany(
      { _id: { $in: slots.map((s) => s._id) } },
      { status: "blocked" }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} slot(s) blocked for: ${reason}`,
      data: { blockedCount: result.modifiedCount, reason },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to block slots", error: err.message });
  }
});

/** POST /api/doctors/register-profile */
router.post("/register-profile", authMiddleware, async (req, res) => {
  try {
    const { specialization, qualifications, licenseNumber, consultationFee, bio, experience, languages, workingHours, location } = req.body;

    const existing = await Doctor.findOne({ userId: req.userId });
    if (existing) return res.status(400).json({ success: false, message: "Doctor profile already exists" });

    const doctor = await Doctor.create({
      userId: req.userId,
      specialization, qualifications, licenseNumber,
      consultationFee, bio, experience, languages, workingHours, location,
    });

    res.status(201).json({ success: true, message: "Doctor profile created", data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create doctor profile", error: err.message });
  }
});

/** GET /api/doctors — list with filters */
router.get("/", async (req, res) => {
  try {
    const { specialization, location, isAvailable, sortBy, search } = req.query;
    const query = {};
    if (specialization) query.specialization = specialization;
    if (location) query.location = { $regex: location, $options: "i" };
    if (isAvailable !== undefined) query.isAvailable = isAvailable === "true";

    let sortOption = { averageRating: -1 };
    if (sortBy === "experience") sortOption = { experience: -1 };
    if (sortBy === "fee-low") sortOption = { consultationFee: 1 };
    if (sortBy === "fee-high") sortOption = { consultationFee: -1 };

    let doctors = await Doctor.find(query)
      .populate("userId", "name email phone")
      .sort(sortOption)
      .limit(100);

    // Filter by name/specialization/location search after populate
    if (search) {
      const lower = search.toLowerCase();
      doctors = doctors.filter((d) =>
        d.userId?.name?.toLowerCase().includes(lower) ||
        d.specialization?.toLowerCase().includes(lower) ||
        d.location?.toLowerCase().includes(lower)
      );
    }

    res.json({ success: true, data: doctors, count: doctors.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch doctors" });
  }
});

// ─────────────────────────────────────────────────
// Wildcard param route LAST
// ─────────────────────────────────────────────────

/** GET /api/doctors/:doctorId */
router.get("/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId).populate("userId", "name email phone");
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch doctor profile" });
  }
});

/** GET /api/doctors/:doctorId/available-slots */
router.get("/:doctorId/available-slots", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: "Date parameter is required" });
    const result = await BookingService.getAvailableSlots(req.params.doctorId, date);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch available slots" });
  }
});

module.exports = router;
