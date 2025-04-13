import express from 'express';
import { createAppointment, getAppointments, rescheduleAppointment, cancelAppointment } from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createAppointment);
router.get('/', protect, getAppointments);
router.put('/reschedule', protect, rescheduleAppointment);
router.put('/cancel', protect, cancelAppointment);

export default router;
