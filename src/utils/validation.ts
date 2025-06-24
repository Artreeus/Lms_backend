import Joi from 'joi';
import mongoose from 'mongoose';

// Common validation schemas
export const objectIdSchema = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'ObjectId validation');

export const emailSchema = Joi.string().email().lowercase().required();
export const passwordSchema = Joi.string().min(6).required();
export const nameSchema = Joi.string().min(2).max(50).trim().required();
export const urlSchema = Joi.string().uri().required();

// Auth validation schemas
export const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: Joi.string().valid('admin', 'user').default('user'),
});

export const loginSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
});

// Course validation schemas
export const createCourseSchema = Joi.object({
  title: Joi.string().min(3).max(100).trim().required(),
  description: Joi.string().min(10).max(1000).trim().required(),
  price: Joi.number().min(0).required(),
  thumbnail: Joi.string().optional(),
});

export const updateCourseSchema = Joi.object({
  title: Joi.string().min(3).max(100).trim().optional(),
  description: Joi.string().min(10).max(1000).trim().optional(),
  price: Joi.number().min(0).optional(),
  thumbnail: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

// Module validation schemas
export const createModuleSchema = Joi.object({
  title: Joi.string().min(3).max(100).trim().required(),
  courseId: objectIdSchema.required(),
  moduleNumber: Joi.number().min(1).optional(),
});

export const updateModuleSchema = Joi.object({
  title: Joi.string().min(3).max(100).trim().optional(),
  moduleNumber: Joi.number().min(1).optional(),
  isActive: Joi.boolean().optional(),
});

// Lecture validation schemas
export const createLectureSchema = Joi.object({
  title: Joi.string().min(3).max(100).trim().required(),
  videoUrl: urlSchema,
  duration: Joi.number().min(1).required(),
  moduleId: objectIdSchema.required(),
  courseId: objectIdSchema.required(),
  lectureNumber: Joi.number().min(1).optional(),
});

export const updateLectureSchema = Joi.object({
  title: Joi.string().min(3).max(100).trim().optional(),
  videoUrl: urlSchema.optional(),
  duration: Joi.number().min(1).optional(),
  lectureNumber: Joi.number().min(1).optional(),
  isActive: Joi.boolean().optional(),
});

// Progress validation schemas
export const updateProgressSchema = Joi.object({
  lectureId: objectIdSchema.required(),
  watchTime: Joi.number().min(0).optional(),
  isCompleted: Joi.boolean().optional(),
});

// Query validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  search: Joi.string().trim().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Utility functions
export const validateObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};