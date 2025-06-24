import { Router } from 'express';
import { LectureController } from '../controllers/lectureController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, validateParams, validateQuery } from '../middleware/validation';
import { uploadPDFs, handleUploadError } from '../middleware/upload';
import { 
  createLectureSchema, 
  updateLectureSchema,
  paginationSchema,
  objectIdSchema 
} from '../utils/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const lectureIdSchema = Joi.object({
  lectureId: objectIdSchema.required(),
});

const moduleIdSchema = Joi.object({
  moduleId: objectIdSchema.required(),
});

const courseIdSchema = Joi.object({
  courseId: objectIdSchema.required(),
});

const noteIdSchema = Joi.object({
  lectureId: objectIdSchema.required(),
  noteId: objectIdSchema.required(),
});

const reorderSchema = Joi.object({
  lectureIds: Joi.array().items(objectIdSchema).min(1).required(),
});

const searchQuerySchema = Joi.object({
  q: Joi.string().min(1).required(),
});

// Protected routes - Admin only for CRUD operations
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createLectureSchema),
  LectureController.createLecture
);

router.get(
  '/',
  authenticate,
  authorize('admin'),
  validateQuery(paginationSchema),
  LectureController.getAllLectures
);

router.get(
  '/:lectureId',
  authenticate,
  validateParams(lectureIdSchema),
  LectureController.getLectureById
);

router.get(
  '/course/:courseId',
  authenticate,
  validateParams(courseIdSchema),
  LectureController.getLecturesByCourse
);

router.get(
  '/module/:moduleId',
  authenticate,
  validateParams(moduleIdSchema),
  LectureController.getLecturesByModule
);

router.get(
  '/course/:courseId/search',
  authenticate,
  validateParams(courseIdSchema),
  validateQuery(searchQuerySchema),
  LectureController.searchLectures
);

router.put(
  '/:lectureId',
  authenticate,
  authorize('admin'),
  validateParams(lectureIdSchema),
  validate(updateLectureSchema),
  LectureController.updateLecture
);

router.delete(
  '/:lectureId',
  authenticate,
  authorize('admin'),
  validateParams(lectureIdSchema),
  LectureController.deleteLecture
);

router.post(
  '/:lectureId/duplicate',
  authenticate,
  authorize('admin'),
  validateParams(lectureIdSchema),
  LectureController.duplicateLecture
);

// PDF notes management
router.post(
  '/:lectureId/pdf-notes',
  authenticate,
  authorize('admin'),
  validateParams(lectureIdSchema),
  uploadPDFs,
  handleUploadError,
  LectureController.uploadPDFNotes
);

router.delete(
  '/:lectureId/pdf-notes/:noteId',
  authenticate,
  authorize('admin'),
  validateParams(noteIdSchema),
  LectureController.removePDFNote
);

// Lecture reordering
router.patch(
  '/module/:moduleId/reorder',
  authenticate,
  authorize('admin'),
  validateParams(moduleIdSchema),
  validate(reorderSchema),
  LectureController.reorderLectures
);

export default router;