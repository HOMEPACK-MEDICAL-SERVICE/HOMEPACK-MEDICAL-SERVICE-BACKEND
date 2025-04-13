import Joi from 'joi';

export const doctorSchema = Joi.object({
  name: Joi.string().required(),
  specialty: Joi.string().required(),
  qualifications: Joi.string().optional(),
  experience: Joi.number().optional(),
  availableSlots: Joi.array().items(Joi.object({
    date: Joi.date().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required()
  })).optional(),
  ratings: Joi.number().optional()
});
