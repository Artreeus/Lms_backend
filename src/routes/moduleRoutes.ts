import { Router } from 'express';
import { ModuleController } from '../controllers/moduleController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateParams } from '../middleware/validation';
import { 
  createModuleSchema, 
  updateModuleSchema,
  objectIdSchema 
} from '../utils/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const moduleIdSchema = Joi.object({
  moduleId: objectIdSchema.required(),
});

const courseIdSchema = Joi.object({
  courseId: objectIdSchema.required(),
});

const reorderSchema = Joi.object({
  moduleIds: Joi.array().items(objectIdSchema).min(1).required(),
});

// Protected routes - Admin only
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createModuleSchema),
  ModuleController.createModule
);

router.get(
  '/course/:courseId',
  authenticate,
  validateParams(courseIdSchema),
  ModuleController.getModulesByCourse
);

router.get(
  '/:moduleId',
  authenticate,
  validateParams(moduleIdSchema),
  ModuleController.getModuleById
);

router.get(
  '/:moduleId/lectures',
  authenticate,
  validateParams(moduleIdSchema),
  ModuleController.getModuleWithLectures
);

router.get(
  '/:moduleId/stats',
  authenticate,
  authorize('admin'),
  validateParams(moduleIdSchema),
  ModuleController.getModuleStats
);

router.put(
  '/:moduleId',
  authenticate,
  authorize('admin'),
  validateParams(moduleIdSchema),
  validate(updateModuleSchema),
  ModuleController.updateModule
);

router.delete(
  '/:moduleId',
  authenticate,
  authorize('admin'),
  validateParams(moduleIdSchema),
  ModuleController.deleteModule
);

router.post(
  '/:moduleId/duplicate',
  authenticate,
  authorize('admin'),
  validateParams(moduleIdSchema),
  ModuleController.duplicateModule
);

router.patch(
  '/course/:courseId/reorder',
  authenticate,
  authorize('admin'),
  validateParams(courseIdSchema),
  validate(reorderSchema),
  ModuleController.reorderModules
);

export default router;