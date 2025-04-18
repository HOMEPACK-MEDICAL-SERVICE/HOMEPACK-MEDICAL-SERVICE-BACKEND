import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";

export const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentSlot } = req.body;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, error: "Doctor not found" });
    }

    // Check that the requested appointment falls within one of the doctor's availableSlots.
    const availableSlot = doctor.availableSlots.find((slot) => {
      // Convert dates to comparable strings (ignoring time zone complications if both are set to the same day)
      const slotDate = new Date(slot.date).toISOString().split("T")[0];
      const requestedDate = new Date(appointmentSlot.date)
        .toISOString()
        .split("T")[0];
      return (
        slotDate === requestedDate &&
        appointmentSlot.startTime >= slot.startTime &&
        appointmentSlot.endTime <= slot.endTime
      );
    });

    if (!availableSlot) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Requested slot is not within the doctor's available hours",
        });
    }

    // Check for conflicts with existing appointments by seeing if any booked appointment overlaps the requested time
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorId,
      "appointmentSlot.date": appointmentSlot.date,
      status: "booked",
      $or: [
        {
          "appointmentSlot.startTime": { $lt: appointmentSlot.endTime },
          "appointmentSlot.endTime": { $gt: appointmentSlot.startTime },
        },
      ],
    });

    if (conflictingAppointment) {
      return res
        .status(400)
        .json({
          success: false,
          error:
            "Appointment slot already booked or conflicting with another appointment",
        });
    }

    // Create the appointment if all checks pass.
    const appointment = await Appointment.create({
      user: req.user.id,
      doctor: doctorId,
      appointmentSlot,
      status: "booked",
    });

    // Send SMS notification for booking
    if (req.user && req.user.phone) {
      const smsSent = await sendSMS(req.user.phone, `Your appointment has been booked for ${appointment.appointmentSlot.date} from ${appointment.appointmentSlot.startTime} to ${appointment.appointmentSlot.endTime}.`);
      if (!smsSent) {
        console.warn(`Failed to send booking SMS to ${req.user.phone}`);
      }
    }

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id }).populate(
      "doctor"
    );
    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { appointmentId, newAppointmentSlot } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, error: "Appointment not found" });
    }

    // Ensure rescheduling is only allowed 24 hours before the appointment
    const currentTime = new Date();
    const appointmentTime = new Date(appointment.appointmentSlot.date);
    if (appointmentTime - currentTime < 24 * 60 * 60 * 1000) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Rescheduling not allowed within 24 hours of appointment",
        });
    }

    const doctor = await Doctor.findById(appointment.doctor);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, error: "Doctor not found" });
    }

    const slotAvailable = doctor.availableSlots.find(
      (slot) =>
        new Date(slot.date).toISOString() ===
          new Date(newAppointmentSlot.date).toISOString() &&
        slot.startTime === newAppointmentSlot.startTime &&
        slot.endTime === newAppointmentSlot.endTime
    );
    if (!slotAvailable) {
      return res
        .status(400)
        .json({ success: false, error: "Selected new slot is not available" });
    }

    const existingAppointment = await Appointment.findOne({
      doctor: doctor._id,
      appointmentSlot: {
        date: newAppointmentSlot.date,
        startTime: newAppointmentSlot.startTime,
        endTime: newAppointmentSlot.endTime,
      },
      status: "booked",
    });
    if (existingAppointment) {
      return res
        .status(400)
        .json({ success: false, error: "New appointment slot already booked" });
    }

    appointment.appointmentSlot = newAppointmentSlot;
    await appointment.save();

    // Send SMS notification for rescheduling
    if (req.user && req.user.phone) {
      const smsSent = await sendSMS(req.user.phone, `Your appointment has been rescheduled to ${appointment.appointmentSlot.date} from ${appointment.appointmentSlot.startTime} to ${appointment.appointmentSlot.endTime}.`);
      if (!smsSent) {
        console.warn(`Failed to send rescheduling SMS to ${req.user.phone}`);
      }
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, error: "Appointment not found" });
    }

    const currentTime = new Date();
    const appointmentTime = new Date(appointment.appointmentSlot.date);
    if (appointmentTime - currentTime < 24 * 60 * 60 * 1000) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Cancellation not allowed within 24 hours of appointment",
        });
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Send SMS notification for cancellation
    if (req.user && req.user.phone) {
      const smsSent = await sendSMS(req.user.phone, `Your appointment on ${appointment.appointmentSlot.date} has been cancelled.`);
      if (!smsSent) {
        console.warn(`Failed to send cancellation SMS to ${req.user.phone}`);
      }
    }

    res.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    next(error);
  }
};
