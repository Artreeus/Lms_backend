import { Response, NextFunction } from 'express';
import { LectureService } from '../services/lectureService';
import { UploadService } from '../services/uploadService';
import { AuthenticatedRequest } from '../types/auth';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

export class LectureController {
  static createLecture = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const lecture = await LectureService.createLecture(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.LECTURE_CREATED,
      data: lecture,
    });
  });

  static getAllLectures = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { lectures, totalCount, totalPages } = await LectureService.getAllLectures(req.query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lectures retrieved successfully',
      data: lectures,
      pagination: {
        currentPage: parseInt(req.query.page as string) || 1,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(req.query.limit as string) || 10,
      },
    });
  });

  static getLectureById = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { lectureId } = req.params;

    const lecture = await LectureService.getLectureById(lectureId);

    if (!lecture) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.LECTURE_NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lecture retrieved successfully',
      data: lecture,
    });
  });

  static getLecturesByCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { courseId } = req.params;

    const lectures = await LectureService.getLecturesByCourse(courseId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Course lectures retrieved successfully',
      data: lectures,
    });
  });

  static getLecturesByModule = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { moduleId } = req.params;

    const lectures = await LectureService.getLecturesByModule(moduleId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Module lectures retrieved successfully',
      data: lectures,
    });
  });

  static updateLecture = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { lectureId } = req.params;

    try {
      const updatedLecture = await LectureService.updateLecture(lectureId, req.body);

      if (!updatedLecture) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.LECTURE_NOT_FOUND,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.LECTURE_UPDATED,
        data: updatedLecture,
      });
    } catch (error: any) {
      if (error.message.includes('Lecture number already exists')) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static deleteLecture = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { lectureId } = req.params;

    try {
      const result = await LectureService.deleteLecture(lectureId);

      if (!result) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.LECTURE_NOT_FOUND,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.LECTURE_DELETED,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.LECTURE_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static uploadPDFNotes = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { lectureId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No PDF files uploaded',
      });
    }

    try {
      const uploadResults = await UploadService.uploadMultiplePDFs(files, req);

      // Add PDF notes to lecture
      for (const uploadResult of uploadResults) {
        await LectureService.addPDFNote(lectureId, {
          fileName: uploadResult.fileName,
          originalName: uploadResult.originalName,
          filePath: uploadResult.filePath,
          fileSize: uploadResult.fileSize,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'PDF notes uploaded successfully',
        data: uploadResults,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.LECTURE_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static removePDFNote = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { lectureId, noteId } = req.params;

    try {
      const updatedLecture = await LectureService.removePDFNote(lectureId, noteId);

      if (!updatedLecture) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.LECTURE_NOT_FOUND,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'PDF note removed successfully',
        data: updatedLecture,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.LECTURE_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static reorderLectures = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { moduleId } = req.params;
    const { lectureIds } = req.body;

    if (!Array.isArray(lectureIds) || lectureIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Lecture IDs array is required',
      });
    }

    try {
      const reorderedLectures = await LectureService.reorderLectures(moduleId, lectureIds);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Lectures reordered successfully',
        data: reorderedLectures,
      });
    } catch (error: any) {
      if (error.message.includes('do not belong to this module') || error.message === ERROR_MESSAGES.MODULE_NOT_FOUND) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static duplicateLecture = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { lectureId } = req.params;

    try {
      const duplicatedLecture = await LectureService.duplicateLecture(lectureId);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Lecture duplicated successfully',
        data: duplicatedLecture,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.LECTURE_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static searchLectures = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { courseId } = req.params;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const lectures = await LectureService.searchLectures(courseId, q);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lecture search completed successfully',
      data: lectures,
    });
  });
}