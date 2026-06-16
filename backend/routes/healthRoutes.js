const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const HealthSummary = require("../models/HealthSummary");
const QRCode = require("qrcode");

const router = express.Router();

/** GET /api/health-summary/me */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const summary = await HealthSummary.findOne({ userId: req.userId });
    res.json({ success: true, data: summary || null });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch health summary" });
  }
});

/** POST /api/health-summary/me — create or update */
router.post("/me", authMiddleware, async (req, res) => {
  try {
    const { bloodGroup, height, weight, allergies, medicalConditions, currentMedications, familyHistory, emergencyContacts, vaccinations } = req.body;

    const summary = await HealthSummary.findOneAndUpdate(
      { userId: req.userId },
      { $set: { bloodGroup, height, weight, allergies, medicalConditions, currentMedications, familyHistory, emergencyContacts, vaccinations, updatedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: "Health summary saved", data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save health summary", error: err.message });
  }
});

/** GET /api/health-summary/:patientId — for doctor to view before consultation */
router.get("/:patientId", authMiddleware, async (req, res) => {
  try {
    const summary = await HealthSummary.findOne({ userId: req.params.patientId });
    res.json({ success: true, data: summary || null });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch health summary" });
  }
});

/** GET /api/health-summary/me/qr — generate emergency QR card */
router.get("/me/qr", authMiddleware, async (req, res) => {
  try {
    const summary = await HealthSummary.findOne({ userId: req.userId });
    if (!summary) return res.status(404).json({ success: false, message: "No health summary found" });

    const qrData = {
      userId: req.userId,
      bloodGroup: summary.bloodGroup,
      allergies: summary.allergies?.map((a) => a.name),
      conditions: summary.medicalConditions?.filter((c) => c.status === "active").map((c) => c.name),
      medications: summary.currentMedications?.map((m) => m.name),
      emergencyContacts: summary.emergencyContacts,
      generatedAt: new Date().toISOString(),
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
    res.json({ success: true, qrCode, data: qrData });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to generate QR code" });
  }
});

module.exports = router;
