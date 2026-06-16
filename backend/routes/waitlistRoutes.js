const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Waitlist = require("../models/Waitlist");
const Slot = require("../models/Slot");

const router = express.Router();

/** POST /api/waitlist/join — join waitlist for a full slot */
router.post("/join", authMiddleware, async (req, res) => {
  try {
    const { slotId, doctorId } = req.body;
    if (!slotId || !doctorId) return res.status(400).json({ success: false, message: "slotId and doctorId required" });

    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });
    if (slot.status === "available") return res.status(400).json({ success: false, message: "Slot is available — book directly" });

    const existing = await Waitlist.findOne({ slotId, patientId: req.userId, status: "waiting" });
    if (existing) return res.status(400).json({ success: false, message: "Already on waitlist for this slot" });

    const count = await Waitlist.countDocuments({ slotId, status: "waiting" });

    const entry = await Waitlist.create({
      slotId,
      doctorId,
      patientId: req.userId,
      position: count + 1,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({ success: true, message: `Added to waitlist at position ${entry.position}`, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to join waitlist", error: err.message });
  }
});

/** DELETE /api/waitlist/:entryId — leave waitlist */
router.delete("/:entryId", authMiddleware, async (req, res) => {
  try {
    const entry = await Waitlist.findOne({ _id: req.params.entryId, patientId: req.userId });
    if (!entry) return res.status(404).json({ success: false, message: "Waitlist entry not found" });
    entry.status = "cancelled";
    await entry.save();
    res.json({ success: true, message: "Removed from waitlist" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to leave waitlist" });
  }
});

/** GET /api/waitlist/me — patient's active waitlist entries */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const entries = await Waitlist.find({ patientId: req.userId, status: { $in: ["waiting", "notified"] } })
      .populate("slotId", "date startTime endTime")
      .populate("doctorId", "specialization consultationFee")
      .sort({ addedAt: -1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch waitlist" });
  }
});

module.exports = router;
