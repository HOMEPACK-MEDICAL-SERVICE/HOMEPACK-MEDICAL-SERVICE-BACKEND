import {Appointment} from '../models/Appointment.js';
import {Doctor} from '../models/Doctor.js';

export const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentSlot } = req.body;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    // Check available slot within the doctor’s schedule
    const slotAvailable = doctor.availableSlots.find(slot =>
      new Date(slot.date).toISOString() === new Date(appointmentSlot.date).toISOString() &&
      slot.startTime === appointmentSlot.startTime &&
      slot.endTime === appointmentSlot.endTime
    );
    if (!slotAvailable) {
      return res.status(400).json({ success: false, error: 'Selected appointment slot is not available' });
    }
    
    // Verify that the slot hasn’t already been booked
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentSlot: {
        date: appointmentSlot.date,
        startTime: appointmentSlot.startTime,
        endTime: appointmentSlot.endTime
      },
      status: 'booked'
    });
    if (existingAppointment) {
      return res.status(400).json({ success: false, error: 'Appointment slot already booked' });
    }
    
    const appointment = await Appointment.create({
      user: req.user.id,
      doctor: doctorId,
      appointmentSlot,
      status: 'booked'
    });
    
    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id }).populate('doctor');
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
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    
    // Ensure rescheduling is only allowed 24 hours before the appointment
    const currentTime = new Date();
    const appointmentTime = new Date(appointment.appointmentSlot.date);
    if ((appointmentTime - currentTime) < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ success: false, error: 'Rescheduling not allowed within 24 hours of appointment' });
    }
    
    const doctor = await Doctor.findById(appointment.doctor);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    
    const slotAvailable = doctor.availableSlots.find(slot =>
      new Date(slot.date).toISOString() === new Date(newAppointmentSlot.date).toISOString() &&
      slot.startTime === newAppointmentSlot.startTime &&
      slot.endTime === newAppointmentSlot.endTime
    );
    if (!slotAvailable) {
      return res.status(400).json({ success: false, error: 'Selected new slot is not available' });
    }
    
    const existingAppointment = await Appointment.findOne({
      doctor: doctor._id,
      appointmentSlot: {
        date: newAppointmentSlot.date,
        startTime: newAppointmentSlot.startTime,
        endTime: newAppointmentSlot.endTime
      },
      status: 'booked'
    });
    if (existingAppointment) {
      return res.status(400).json({ success: false, error: 'New appointment slot already booked' });
    }
    
    appointment.appointmentSlot = newAppointmentSlot;
    await appointment.save();
    
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
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    
    const currentTime = new Date();
    const appointmentTime = new Date(appointment.appointmentSlot.date);
    if ((appointmentTime - currentTime) < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ success: false, error: 'Cancellation not allowed within 24 hours of appointment' });
    }
    
    appointment.status = 'cancelled';
    await appointment.save();
    
    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    next(error);
  }
};
