import { Router } from 'express';
import { CourseController } from '../controllers/courseController';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate, validateQuery, validateParams } from '../middleware/validation';
import { uploadThumbnail, handleUploadError } from '../middleware/upload';
import { 
  createCourseSchema, 
  updateCourseSchema, 
  paginationSchema,
  objectIdSchema 
} from '../utils/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const courseIdSchema = Joi.object({
  courseId: objectIdSchema.required(),
});

const slugSchema = Joi.object({
  slug: Joi.string().required(),
});

// Public routes
router.get('/public', validateQuery(paginationSchema), CourseController.getPublicCourses);
router.get('/slug/:slug', validateParams(slugSchema), CourseController.getCourseBySlug);
router.get('/:courseId/public', validateParams(courseIdSchema), CourseController.getCourseById);

// Protected routes - Admin only
router.post(
  '/',
  authenticate,
  authorize('admin'),
  uploadThumbnail,
  handleUploadError,
  validate(createCourseSchema),
  CourseController.createCourse
);

router.get(
  '/',
  authenticate,
  authorize('admin'),
  validateQuery(paginationSchema),
  CourseController.getAllCourses
);

router.get(
  '/my-courses',
  authenticate,
  authorize('admin'),
  validateQuery(paginationSchema),
  CourseController.getMyCourses
);

router.get(
  '/:courseId',
  authenticate,
  validateParams(courseIdSchema),
  CourseController.getCourseById
);

router.get(
  '/:courseId/content',
  authenticate,
  validateParams(courseIdSchema),
  CourseController.getCourseWithContent
);

router.put(
  '/:courseId',
  authenticate,
  authorize('admin'),
  validateParams(courseIdSchema),
  uploadThumbnail,
  handleUploadError,
  validate(updateCourseSchema),
  CourseController.updateCourse
);

router.delete(
  '/:courseId',
  authenticate,
  authorize('admin'),
  validateParams(courseIdSchema),
  CourseController.deleteCourse
);

router.patch(
  '/:courseId/stats',
  authenticate,
  authorize('admin'),
  validateParams(courseIdSchema),
  CourseController.updateCourseStats
);

// File upload routes
router.post(
  '/upload/thumbnail',
  authenticate,
  authorize('admin'),
  uploadThumbnail,
  handleUploadError,
  CourseController.uploadThumbnail
);

export default router;