import { Router } from 'express';
import { ProgressController } from '../controllers/progressController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { updateProgressSchema, objectIdSchema } from '../utils/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const courseIdSchema = Joi.object({
  courseId: objectIdSchema.required(),
});

const lectureAccessSchema = Joi.object({
  courseId: objectIdSchema.required(),
  lectureId: objectIdSchema.required(),
});

const bulkUpdateSchema = Joi.object({
  updates: Joi.array().items(updateProgressSchema).min(1).required(),
});

// User progress routes
router.post(
  '/course/:courseId/initialize',
  authenticate,
  validateParams(courseIdSchema),
  ProgressController.initializeProgress
);

router.get(
  '/course/:courseId',
  authenticate,
  validateParams(courseIdSchema),
  ProgressController.getUserProgress
);

router.put(
  '/course/:courseId/lecture',
  authenticate,
  validateParams(courseIdSchema),
  validate(updateProgressSchema),
  ProgressController.updateLectureProgress
);

router.post(
  '/course/:courseId/bulk-update',
  authenticate,
  validateParams(courseIdSchema),
  validate(bulkUpdateSchema),
  ProgressController.bulkUpdateProgress
);

router.get(
  '/course/:courseId/next-lecture',
  authenticate,
  validateParams(courseIdSchema),
  ProgressController.getNextUnlockedLecture
);

router.get(
  '/course/:courseId/lecture/:lectureId/access',
  authenticate,
  validateParams(lectureAccessSchema),
  ProgressController.checkLectureAccess
);

router.delete(
  '/course/:courseId/reset',
  authenticate,
  validateParams(courseIdSchema),
  ProgressController.resetProgress
);

// User dashboard
router.get(
  '/my-courses',
  authenticate,
  ProgressController.getUserCourseList
);

router.get(
  '/dashboard',
  authenticate,
  ProgressController.getUserDashboard
);

// Admin routes
router.get(
  '/admin/overview',
  authenticate,
  authorize('admin'),
  ProgressController.getAdminProgressOverview
);

router.get(
  '/course/:courseId/stats',
  authenticate,
  authorize('admin'),
  validateParams(courseIdSchema),
  ProgressController.getCourseProgressStats
);

export default router;