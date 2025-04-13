import {Schema, model} from 'mongoose';

const timeSlotSchema = new Schema({
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
});

const doctorSchema = new Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  qualifications: { type: String },
  experience: { type: Number },
  availableSlots: [timeSlotSchema],
  ratings: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const Doctor = model('Doctor', doctorSchema);
