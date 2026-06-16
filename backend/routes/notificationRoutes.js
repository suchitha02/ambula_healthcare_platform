const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

const router = express.Router();

/** GET /api/notifications/me */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.userId };
    if (status) query.status = status;
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.userId, status: "unread" });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

/** PUT /api/notifications/:id/read */
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: "read", readAt: new Date() }
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark read" });
  }
});

/** PUT /api/notifications/mark-all-read */
router.put("/mark-all-read", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, status: "unread" }, { status: "read", readAt: new Date() });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark all read" });
  }
});

module.exports = router;
