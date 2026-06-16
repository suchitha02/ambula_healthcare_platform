require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const healthRoutes = require("./routes/healthRoutes");
const healthRecordRoutes = require("./routes/healthRecordRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const waitlistRoutes = require("./routes/waitlistRoutes");

const app = express();

connectDB();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Ambula Backend Running", version: "1.0.0" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/health-summary", healthRoutes);
app.use("/api/health-records", healthRecordRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/waitlist", waitlistRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const server = http.createServer(app);

// FIX: export io so routes/services can emit events
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
});

// Socket.IO namespaces
const appointmentNS = io.of("/appointments");
const notificationNS = io.of("/notifications");
const queueNS = io.of("/queue");

appointmentNS.on("connection", (socket) => {
  socket.on("join-doctor-room", (doctorId) => socket.join(`doctor-${doctorId}`));
  socket.on("join-appointment", (appointmentId) => socket.join(`appointment-${appointmentId}`));
  socket.on("disconnect", () => {});
});

notificationNS.on("connection", (socket) => {
  socket.on("subscribe-user", (userId) => socket.join(`user-${userId}`));
  socket.on("disconnect", () => {});
});

queueNS.on("connection", (socket) => {
  socket.on("join-queue", (doctorId) => socket.join(`doctor-queue-${doctorId}`));
  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export io for use in services/routes
module.exports = { io, appointmentNS, notificationNS, queueNS };
