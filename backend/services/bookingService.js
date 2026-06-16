const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Slot = require("../models/Slot");
const Appointment = require("../models/Appointment");
const Waitlist = require("../models/Waitlist");
const Notification = require("../models/Notification");
const HealthSummary = require("../models/HealthSummary");

class BookingService {
  /**
   * CRITICAL: Book appointment with double-booking prevention.
   * Uses MongoDB ACID transactions — slot status check + update are atomic.
   * WiredTiger serialises concurrent writes, so only one transaction can
   * commit status:'booked'; the other sees the updated status and fails-fast.
   */
  static async bookAppointment(slotId, patientId, doctorId, consultationType, patientDetails) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Lock slot within transaction
      const slot = await Slot.findById(slotId).session(session);
      if (!slot) throw new Error("Slot not found");
      if (slot.status !== "available") throw new Error("Slot is no longer available");
      if (slot.doctorId.toString() !== doctorId.toString()) throw new Error("Invalid doctor ID for this slot");

      // 2. Create appointment
      const bookingId = `APT-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
      const [appointment] = await Appointment.create(
        [
          {
            patientId,
            doctorId,
            slotId,
            bookingId,
            status: "scheduled",
            consultationType,
            patientDetails,
            statusHistory: [{ status: "scheduled", timestamp: new Date(), reason: "Initial booking" }],
          },
        ],
        { session }
      );

      // 3. Mark slot booked (atomic with step 1 check)
      await Slot.findByIdAndUpdate(
        slotId,
        { status: "booked", appointmentId: appointment._id, updatedAt: new Date() },
        { session, new: true }
      );

      await session.commitTransaction();

      // 4. Emit real-time slot update AFTER commit
      try {
        const { appointmentNS } = require("../server");
        appointmentNS.to(`doctor-${doctorId}`).emit("slot-booked", { slotId, doctorId });
      } catch (_) {
        // Socket emit is best-effort; don't fail the booking
      }

      return {
        success: true,
        appointmentId: appointment._id,
        bookingId: appointment.bookingId,
        message: "Appointment booked successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Booking failed: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /** Get available slots for a doctor on a specific date */
  static async getAvailableSlots(doctorId, date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const slots = await Slot.find({ doctorId, date: { $gte: start, $lt: end }, status: "available" }).sort({ startTime: 1 });
    return { success: true, slots, count: slots.length };
  }

  /**
   * Cancel appointment.
   * FIX: Accept role so doctors can also cancel on behalf of patient.
   */
  static async cancelAppointment(appointmentId, userId, reason = "", userRole = "patient") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const appointment = await Appointment.findById(appointmentId).session(session);
      if (!appointment) throw new Error("Appointment not found");

      const isPatient = appointment.patientId.toString() === userId.toString();
      const isDoctor = appointment.doctorId.toString() === userId.toString();

      if (!isPatient && !isDoctor) throw new Error("Unauthorised: Cannot cancel this appointment");
      if (["completed", "cancelled"].includes(appointment.status))
        throw new Error(`Cannot cancel appointment with status: ${appointment.status}`);

      appointment.status = "cancelled";
      appointment.statusHistory.push({
        status: "cancelled",
        timestamp: new Date(),
        changedBy: userId,
        reason: reason || (isDoctor ? "Cancelled by doctor" : "Cancelled by patient"),
      });
      await appointment.save({ session });

      // Release slot
      const slot = await Slot.findById(appointment.slotId).session(session);
      if (slot && slot.status === "booked") {
        slot.status = "available";
        slot.appointmentId = null;
        await slot.save({ session });

        // Notify first waitlist patient
        const nextWaiting = await Waitlist.findOne({
          slotId: slot._id,
          status: "waiting",
        })
          .sort({ position: 1 })
          .session(session);

        if (nextWaiting) {
          nextWaiting.status = "notified";
          nextWaiting.notificationSentAt = new Date();
          await nextWaiting.save({ session });

          await Notification.create(
            [
              {
                userId: nextWaiting.patientId,
                type: "waitlist-available",
                title: "Slot Available!",
                message: "A slot you were waitlisted for is now available. Book quickly before it's gone.",
                data: { slotId: slot._id },
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
              },
            ],
            { session }
          );
        }
      }

      await session.commitTransaction();

      // Emit real-time update
      try {
        const { appointmentNS } = require("../server");
        appointmentNS.to(`doctor-${appointment.doctorId}`).emit("slot-released", { slotId: appointment.slotId });
      } catch (_) {}

      return { success: true, message: "Appointment cancelled successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Cancellation failed: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /** Reschedule appointment */
  static async rescheduleAppointment(appointmentId, newSlotId, patientId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const appointment = await Appointment.findById(appointmentId).session(session);
      if (!appointment) throw new Error("Appointment not found");
      if (appointment.patientId.toString() !== patientId.toString()) throw new Error("Unauthorised");

      // Release old slot
      const oldSlot = await Slot.findById(appointment.slotId).session(session);
      if (oldSlot && oldSlot.status === "booked") {
        oldSlot.status = "available";
        oldSlot.appointmentId = null;
        await oldSlot.save({ session });
      }

      // Check new slot
      const newSlot = await Slot.findById(newSlotId).session(session);
      if (!newSlot || newSlot.status !== "available") throw new Error("New slot is not available");

      appointment.slotId = newSlotId;
      appointment.statusHistory.push({ status: "rescheduled", timestamp: new Date(), reason: "Patient rescheduled" });
      await appointment.save({ session });

      newSlot.status = "booked";
      newSlot.appointmentId = appointmentId;
      await newSlot.save({ session });

      await session.commitTransaction();
      return { success: true, message: "Appointment rescheduled successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Reschedule failed: ${error.message}`);
    } finally {
      await session.endSession();
    }
  }

  /** Get patient appointments */
  static async getPatientAppointments(patientId, status = null) {
    const query = { patientId };
    if (status) query.status = status;
    const appointments = await Appointment.find(query)
      .populate("doctorId", "specialization consultationFee")
      .populate({ path: "doctorId", populate: { path: "userId", select: "name" } })
      .populate("slotId", "date startTime endTime")
      .sort({ createdAt: -1 });
    return { success: true, appointments, count: appointments.length };
  }

  /** Get doctor appointments with optional date filter */
  static async getDoctorAppointments(doctorId, status = null, date = null) {
    const query = { doctorId };
    if (status) query.status = status;

    let appointments = await Appointment.find(query)
      .populate("patientId", "name email phone")
      .populate("slotId", "date startTime endTime")
      .sort({ createdAt: -1 });

    if (date) {
      const targetDate = new Date(date);
      appointments = appointments.filter((apt) => {
        if (!apt.slotId?.date) return false;
        const slotDate = new Date(apt.slotId.date);
        return (
          slotDate.getFullYear() === targetDate.getFullYear() &&
          slotDate.getMonth() === targetDate.getMonth() &&
          slotDate.getDate() === targetDate.getDate()
        );
      });
    }

    // Attach the patient's health summary so the doctor can review it
    // before the consultation begins (blood group, conditions, medications,
    // allergies). Looked up per unique patientId to avoid repeat queries.
    const uniquePatientIds = [...new Set(appointments.map((a) => a.patientId?._id?.toString()).filter(Boolean))];
    const summaries = await HealthSummary.find({ userId: { $in: uniquePatientIds } });
    const summaryByPatient = {};
    summaries.forEach((s) => { summaryByPatient[s.userId.toString()] = s; });

    appointments = appointments.map((apt) => {
      const obj = apt.toObject();
      obj.healthSummary = summaryByPatient[apt.patientId?._id?.toString()] || null;
      return obj;
    });

    return { success: true, appointments, count: appointments.length };
  }
}

module.exports = BookingService;
