import express from 'express';
import passport from 'passport';
import { signup, login, googleCallback, facebookCallback, sendOTP, verifyOTP, getDoctors, getProfile, updateProfile, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false }), facebookCallback);

// Phone OTP endpoints
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

router.get('/doctors',protect, getDoctors);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// Reset password endpoint
router.post('/reset-password', resetPassword);

export default router;
