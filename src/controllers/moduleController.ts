import { Response, NextFunction } from 'express';
import { ModuleService } from '../services/moduleService';
import { AuthenticatedRequest } from '../types/auth';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

export class ModuleController {
  static createModule = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const module = await ModuleService.createModule(req.body);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.MODULE_CREATED,
      data: module,
    });
  });

  static getModulesByCourse = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { courseId } = req.params;

    const modules = await ModuleService.getModulesByCourse(courseId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Modules retrieved successfully',
      data: modules,
    });
  });

  static getModuleById = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { moduleId } = req.params;

    const module = await ModuleService.getModuleById(moduleId);

    if (!module) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.MODULE_NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Module retrieved successfully',
      data: module,
    });
  });

  static getModuleWithLectures = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { moduleId } = req.params;

    const moduleWithLectures = await ModuleService.getModuleWithLectures(moduleId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Module with lectures retrieved successfully',
      data: moduleWithLectures,
    });
  });

  static updateModule = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { moduleId } = req.params;

    try {
      const updatedModule = await ModuleService.updateModule(moduleId, req.body);

      if (!updatedModule) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.MODULE_NOT_FOUND,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.MODULE_UPDATED,
        data: updatedModule,
      });
    } catch (error: any) {
      if (error.message.includes('Module number already exists')) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static deleteModule = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { moduleId } = req.params;

    try {
      const result = await ModuleService.deleteModule(moduleId);

      if (!result) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.MODULE_NOT_FOUND,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.MODULE_DELETED,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.MODULE_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static reorderModules = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { courseId } = req.params;
    const { moduleIds } = req.body;

    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Module IDs array is required',
      });
    }

    try {
      const reorderedModules = await ModuleService.reorderModules(courseId, moduleIds);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Modules reordered successfully',
        data: reorderedModules,
      });
    } catch (error: any) {
      if (error.message.includes('do not belong to this course') || error.message === ERROR_MESSAGES.COURSE_NOT_FOUND) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static duplicateModule = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { moduleId } = req.params;

    try {
      const duplicatedModule = await ModuleService.duplicateModule(moduleId);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Module duplicated successfully',
        data: duplicatedModule,
      });
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.MODULE_NOT_FOUND) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message,
        });
      }
      throw error;
    }
  });

  static getModuleStats = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { moduleId } = req.params;

    const module = await ModuleService.getModuleById(moduleId);

    if (!module) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.MODULE_NOT_FOUND,
      });
    }

    // Calculate module statistics
    const stats = await module.calculateLectureStats();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Module statistics retrieved successfully',
      data: {
        moduleId: module._id,
        title: module.title,
        moduleNumber: module.moduleNumber,
        ...stats,
      },
    });
  });
}