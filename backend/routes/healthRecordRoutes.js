const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const HealthRecord = require("../models/HealthRecord");

const router = express.Router();
// Memory storage — integrate Cloudinary for production via multer-storage-cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/** GET /api/health-records/me */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    const query = { userId: req.userId };
    if (type) query.type = type;
    const records = await HealthRecord.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch records" });
  }
});

/** POST /api/health-records/me — upload a record */
router.post("/me", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { type, title, description, tags, visibility } = req.body;
    if (!type || !title) return res.status(400).json({ success: false, message: "type and title are required" });

    // In production: upload req.file to Cloudinary here and store the URL
    const fileData = req.file
      ? { fileName: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, url: "" }
      : undefined;

    const record = await HealthRecord.create({
      userId: req.userId,
      type,
      title,
      description,
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      visibility: visibility || "private",
      file: fileData,
    });

    res.status(201).json({ success: true, message: "Record uploaded", data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to upload record", error: err.message });
  }
});

/** DELETE /api/health-records/:recordId */
router.delete("/:recordId", authMiddleware, async (req, res) => {
  try {
    const record = await HealthRecord.findOne({ _id: req.params.recordId, userId: req.userId });
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    await record.deleteOne();
    res.json({ success: true, message: "Record deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete record" });
  }
});

module.exports = router;
