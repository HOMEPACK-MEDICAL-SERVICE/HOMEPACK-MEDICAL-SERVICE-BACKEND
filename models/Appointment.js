import {Schema, model} from 'mongoose';

const appointmentSlotSchema = new Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
});

const appointmentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentSlot: appointmentSlotSchema,
  status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' }
}, {
  timestamps: true
});

export const Appointment = model('Appointment', appointmentSchema);
