import { Response, NextFunction } from 'express';
import { ProgressService } from '../services/progressService';
import { AuthenticatedRequest } from '../types/auth';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

export class ProgressController {
  static initializeProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;

    const progress = await ProgressService.initializeProgress(req.user._id, courseId);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Progress initialized successfully',
      data: progress,
    });
  });

  static getUserProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;

    const progress = await ProgressService.getUserProgress(req.user._id, courseId);

    if (!progress) {
      // Initialize progress if it doesn't exist
      const newProgress = await ProgressService.initializeProgress(req.user._id, courseId);
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Progress retrieved successfully',
        data: newProgress,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Progress retrieved successfully',
      data: progress,
    });
  });

  static updateLectureProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;

    try {
      const progress = await ProgressService.updateLectureProgress(
        req.user._id,
        courseId,
        req.body
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.PROGRESS_UPDATED,
        data: progress,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.COURSE_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static getUserCourseList = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const progressList = await ProgressService.getUserCourseList(req.user._id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User course list retrieved successfully',
      data: progressList,
    });
  });

  static getCourseProgressStats = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;

    const stats = await ProgressService.getCourseProgressStats(courseId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Course progress statistics retrieved successfully',
      data: stats,
    });
  });

  static getNextUnlockedLecture = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;

    const nextLectureId = await ProgressService.getNextUnlockedLecture(req.user._id, courseId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Next unlocked lecture retrieved successfully',
      data: {
        nextLectureId,
      },
    });
  });

  static checkLectureAccess = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId, lectureId } = req.params;

    const isUnlocked = await ProgressService.isLectureUnlocked(req.user._id, courseId, lectureId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Lecture access checked successfully',
      data: {
        lectureId,
        isUnlocked,
      },
    });
  });

  static resetProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;

    const progress = await ProgressService.resetProgress(req.user._id, courseId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Progress reset successfully',
      data: progress,
    });
  });

  static getUserDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const dashboardStats = await ProgressService.getUserDashboardStats(req.user._id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User dashboard retrieved successfully',
      data: dashboardStats,
    });
  });

  static bulkUpdateProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Updates array is required',
      });
    }

    try {
      const progress = await ProgressService.bulkUpdateProgress(
        req.user._id,
        courseId,
        updates
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Progress updated successfully',
        data: progress,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.COURSE_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static getAdminProgressOverview = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    const { courseId } = req.query;

    if (!courseId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    const stats = await ProgressService.getCourseProgressStats(courseId as string);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Admin progress overview retrieved successfully',
      data: stats,
    });
  });
}