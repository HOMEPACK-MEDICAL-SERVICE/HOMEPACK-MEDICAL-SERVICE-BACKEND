import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {User} from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import { sendSMS } from '../utils/smsService.js';
import { sendEmail } from '../utils/emailService.js';

// Helper: Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// controllers/authController.js
export const signup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,  // <- destructure here
      phone,
      age,
      gender,
      medicalHistory
    } = req.body;

    // Early check (redundant with Joi but safer)
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, error: 'Passwords do not match' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      age,
      gender,
      medicalHistory,
      role: 'user'
    });

    // Send welcome email
    sendEmail(user.email, 'Welcome!', 'Thank you for signing up.');

    // Send welcome SMS
    if (user.phone) {
      const smsSent = await sendSMS(user.phone, 'Welcome to our service! Thank you for signing up.');
      if (!smsSent) {
        console.warn(`Failed to send welcome SMS to ${user.phone}`);
      }
    }

    res
      .status(201)
      .json({ success: true, data: user, token: generateToken(user) });
  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }
    res.json({ success: true, token: generateToken(user), data: user });
  } catch (error) {
    next(error);
  }
};

// OAuth callbacks (Google and Facebook)
// These endpoints are hit after Passport authentication.
export const googleCallback = (req, res) => {
  const token = generateToken(req.user);
  res.json({ success: true, token, data: req.user });
};

export const facebookCallback = (req, res) => {
  const token = generateToken(req.user);
  res.json({ success: true, token, data: req.user });
};

// In-memory OTP store for demonstration (replace with persistent storage for production)
let otpStore = {};

// New function to get doctors with search and filter
export const getDoctors = async (req, res, next) => {
  try {
    const { name, specialty, experience, ratings } = req.query;

    // Build query object
    const query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' }; // case-insensitive partial match
    }
    if (specialty) {
      query.specialty = { $regex: specialty, $options: 'i' };
    }
    if (experience) {
      // Support filtering by minimum experience
      query.experience = { $gte: Number(experience) };
    }
    if (ratings) {
      // Support filtering by minimum ratings
      query.ratings = { $gte: Number(ratings) };
    }

    const doctors = await Doctor.find(query);

    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

export const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // valid 5 minutes
    
    await sendSMS(phone, `Your OTP is: ${otp}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (otpStore[phone] && otpStore[phone].otp === otp && otpStore[phone].expires > Date.now()) {
      let user = await User.findOne({ phone });
      if (!user) {
        user = await User.create({ phone, role: 'user' });
      }
      delete otpStore[phone];
      res.json({ success: true, token: generateToken(user), data: user });
    } else {
      res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }
  } catch (error) {
    next(error);
  }
};
