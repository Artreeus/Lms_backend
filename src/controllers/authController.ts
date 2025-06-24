import { Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../types/auth';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import { asyncHandler } from '../middleware/errorHandler';

export class AuthController {
  static register = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const result = await AuthService.register(req.body);

    if (!result.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(result);
    }

    res.status(HTTP_STATUS.CREATED).json(result);
  });

  static login = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body);

    if (!result.success) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json(result);
    }

    // Set cookie for web clients (optional)
    if (result.data?.token) {
      res.cookie('token', result.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    res.status(HTTP_STATUS.OK).json(result);
  });

  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Clear cookie
    res.clearCookie('token');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logout successful',
    });
  });

  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const user = await AuthService.getUserProfile(req.user._id);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    });
  });

  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const updatedUser = await AuthService.updateUserProfile(req.user._id, req.body);

    if (!updatedUser) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  });

  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    try {
      await AuthService.changePassword(req.user._id, currentPassword, newPassword);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  });

  static getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { page = 1, limit = 10, search } = req.query;

    const { users, totalCount } = await AuthService.getAllUsers(
      parseInt(page as string),
      parseInt(limit as string),
      search as string
    );

    const totalPages = Math.ceil(totalCount / parseInt(limit as string));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit as string),
      },
    });
  });

  static deactivateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'User ID is required',
      });
    }

    const result = await AuthService.deactivateUser(userId);

    if (!result) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND,
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'User deactivated successfully',
    });
  });

  static refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    // Generate new token
    const { generateToken } = require('../utils/jwt');
    const token = generateToken({
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
    });

    // Set new cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token,
        user: req.user,
      },
    });
  });
}