import Joi from 'joi';

export const appointmentSchema = Joi.object({
  doctorId: Joi.string().required(),
  appointmentSlot: Joi.object({
    date: Joi.date().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required()
  }).required()
});

export const rescheduleSchema = Joi.object({
  appointmentId: Joi.string().required(),
  newAppointmentSlot: Joi.object({
    date: Joi.date().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required()
  }).required()
});
