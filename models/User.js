import {Schema, model} from 'mongoose';

const userSchema = new Schema({
  name: { type: String },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  phone: { type: String, unique: true, sparse: true },
  age: { type: Number },
  gender: { type: String },
  medicalHistory: { type: String },
  googleId: { type: String },
  facebookId: { type: String },
  role: { type: String, default: 'user' }
}, {
  timestamps: true
});

export const User = model('User', userSchema);
