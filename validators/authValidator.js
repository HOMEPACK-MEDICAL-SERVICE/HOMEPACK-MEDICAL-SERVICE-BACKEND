import Joi from "joi";

export const signupSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.any()
  .valid(Joi.ref('password'))
  .required()
  .messages({ 'any.only': 'Confirm password must match password' }),
  phone: Joi.string().required(),
  age: Joi.number().optional(),
  gender: Joi.string().optional(),
  medicalHistory: Joi.string().optional(),
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
