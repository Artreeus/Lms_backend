import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { IUser, IRegisterRequest, ILoginRequest, IAuthResponse } from '../types/auth';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

export class AuthService {
  static async register(userData: IRegisterRequest): Promise<IAuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return {
          success: false,
          message: ERROR_MESSAGES.USER_ALREADY_EXISTS,
        };
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate token
      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      // Remove password from response
      const userWithoutPassword = user.toObject();
      delete userWithoutPassword.password;

      return {
        success: true,
        message: SUCCESS_MESSAGES.USER_REGISTERED,
        data: {
          user: userWithoutPassword,
          token,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async login(credentials: ILoginRequest): Promise<IAuthResponse> {
    try {
      // Find user with password
      const user = await User.findOne({ email: credentials.email }).select('+password');
      
      if (!user || !user.isActive) {
        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      // Check password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      // Generate token
      const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role,
      });

      // Remove password from response
      const userWithoutPassword = user.toObject();
      delete userWithoutPassword.password;

      return {
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
        data: {
          user: userWithoutPassword,
          token,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async updateUserProfile(
    userId: string,
    updateData: Partial<Pick<IUser, 'firstName' | 'lastName'>>
  ): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      );
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async deactivateUser(userId: string): Promise<boolean> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );
      return !!user;
    } catch (error) {
      throw error;
    }
  }

  static async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ users: IUser[]; totalCount: number }> {
    try {
      const query: any = {};
      
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [users, totalCount] = await Promise.all([
        User.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return { users, totalCount };
    } catch (error) {
      throw error;
    }
  }
}