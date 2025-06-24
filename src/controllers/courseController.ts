import { Response, NextFunction } from 'express';
import { CourseService } from '../services/courseService';
import { UploadService } from '../services/uploadService';
import { AuthenticatedRequest } from '../types/auth';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

export class CourseController {
  static createCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    let thumbnailUrl = '';

    // Handle thumbnail upload if present
    if (req.file) {
      thumbnailUrl = await UploadService.uploadThumbnail(req.file, req);
    }

    const courseData = {
      ...req.body,
      thumbnail: thumbnailUrl,
    };

    const course = await CourseService.createCourse(courseData, req.user._id);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.COURSE_CREATED,
      data: course,
    });
  });

  static getAllCourses = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { courses, totalCount, totalPages } = await CourseService.getAllCourses(req.query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Courses retrieved successfully',
      data: courses,
      pagination: {
        currentPage: parseInt(req.query.page as string) || 1,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(req.query.limit as string) || 10,
      },
    });
  });

  static getPublicCourses = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const { courses, totalCount, totalPages } = await CourseService.getPublicCourses(page, limit, search);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Public courses retrieved successfully',
      data: courses,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  });

  static getCourseById = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { courseId } = req.params;

    const course = await CourseService.getCourseById(courseId);

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.COURSE_NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Course retrieved successfully',
      data: course,
    });
  });

  static getCourseBySlug = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    const course = await CourseService.getCourseBySlug(slug);

    if (!course) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.COURSE_NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Course retrieved successfully',
      data: course,
    });
  });

  static getCourseWithContent = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { courseId } = req.params;

    const courseWithContent = await CourseService.getCourseWithContent(courseId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Course with content retrieved successfully',
      data: courseWithContent,
    });
  });

  static updateCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;
    let updateData = { ...req.body };

    // Handle thumbnail upload if present
    if (req.file) {
      const thumbnailUrl = await UploadService.uploadThumbnail(req.file, req);
      updateData.thumbnail = thumbnailUrl;
    }

    try {
      const updatedCourse = await CourseService.updateCourse(courseId, updateData, req.user._id);

      if (!updatedCourse) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.COURSE_NOT_FOUND,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.COURSE_UPDATED,
        data: updatedCourse,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static deleteCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;

    try {
      const result = await CourseService.deleteCourse(courseId, req.user._id);

      if (!result) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.COURSE_NOT_FOUND,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.COURSE_DELETED,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.UNAUTHORIZED || error.message === ERROR_MESSAGES.COURSE_NOT_FOUND) {
        return res.status(error.message === ERROR_MESSAGES.UNAUTHORIZED ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static updateCourseStats = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { courseId } = req.params;

    await CourseService.updateCourseStats(courseId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Course stats updated successfully',
    });
  });

  static uploadThumbnail = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const thumbnailUrl = await UploadService.uploadThumbnail(req.file, req);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Thumbnail uploaded successfully',
      data: {
        url: thumbnailUrl,
      },
    });
  });

  static getMyCourses = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    // For admin users, get all courses they created
    const query = {
      ...req.query,
      createdBy: req.user._id,
    };

    const { courses, totalCount, totalPages } = await CourseService.getAllCourses(query);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'My courses retrieved successfully',
      data: courses,
      pagination: {
        currentPage: parseInt(req.query.page as string) || 1,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(req.query.limit as string) || 10,
      },
    });
  });
}