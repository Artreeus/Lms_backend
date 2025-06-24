import Progress from '../models/Progress';
import Course from '../models/Course';
import { IProgress, IUpdateProgressRequest } from '../types/progress';
import { ERROR_MESSAGES } from '../utils/constants';

export class ProgressService {
  static async initializeProgress(userId: string, courseId: string): Promise<IProgress> {
    try {
      // Verify course exists
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
      }

      // Initialize or get existing progress
      const progress = await Progress.initializeForCourse(userId, courseId);
      return progress;
    } catch (error) {
      throw error;
    }
  }

  static async getUserProgress(userId: string, courseId: string): Promise<IProgress | null> {
    try {
      const progress = await Progress.findOne({ userId, courseId })
        .populate('courseId', 'title thumbnail')
        .populate('modules.moduleId', 'title moduleNumber')
        .populate('modules.lectures.lectureId', 'title lectureNumber');

      return progress;
    } catch (error) {
      throw error;
    }
  }

  static async updateLectureProgress(
    userId: string,
    courseId: string,
    updateData: IUpdateProgressRequest
  ): Promise<IProgress> {
    try {
      let progress = await Progress.findOne({ userId, courseId });

      if (!progress) {
        // Initialize progress if it doesn't exist
        progress = await this.initializeProgress(userId, courseId);
      }

      // Update lecture progress
      await progress.updateLectureProgress(
        updateData.lectureId,
        updateData.watchTime,
        updateData.isCompleted
      );

      return progress;
    } catch (error) {
      throw error;
    }
  }

  static async getUserCourseList(userId: string): Promise<IProgress[]> {
    try {
      const progressList = await Progress.find({ userId })
        .populate('courseId', 'title thumbnail price')
        .sort({ lastAccessedAt: -1 });

      return progressList;
    } catch (error) {
      throw error;
    }
  }

  static async getCourseProgressStats(courseId: string): Promise<{
    totalUsers: number;
    completedUsers: number;
    averageProgress: number;
    activeUsers: number; // Users who accessed in last 30 days
  }> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const stats = await Progress.aggregate([
        { $match: { courseId: courseId } },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            completedUsers: {
              $sum: { $cond: ['$isCompleted', 1, 0] }
            },
            averageProgress: { $avg: '$progressPercentage' },
            activeUsers: {
              $sum: {
                $cond: [
                  { $gte: ['$lastAccessedAt', thirtyDaysAgo] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalUsers: 0,
        completedUsers: 0,
        averageProgress: 0,
        activeUsers: 0,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getNextUnlockedLecture(
    userId: string,
    courseId: string
  ): Promise<string | null> {
    try {
      const progress = await Progress.findOne({ userId, courseId });

      if (!progress) {
        // If no progress exists, initialize it and return first lecture
        const newProgress = await this.initializeProgress(userId, courseId);
        return newProgress.getNextUnlockedLecture();
      }

      return progress.getNextUnlockedLecture();
    } catch (error) {
      throw error;
    }
  }

  static async isLectureUnlocked(
    userId: string,
    courseId: string,
    lectureId: string
  ): Promise<boolean> {
    try {
      const progress = await Progress.findOne({ userId, courseId });

      if (!progress) {
        // If no progress exists, only first lecture is unlocked
        await this.initializeProgress(userId, courseId);
        const newProgress = await Progress.findOne({ userId, courseId });
        return newProgress ? newProgress.isLectureUnlocked(lectureId) : false;
      }

      return progress.isLectureUnlocked(lectureId);
    } catch (error) {
      throw error;
    }
  }

  static async resetProgress(userId: string, courseId: string): Promise<IProgress> {
    try {
      // Delete existing progress
      await Progress.findOneAndDelete({ userId, courseId });

      // Reinitialize progress
      const newProgress = await this.initializeProgress(userId, courseId);
      return newProgress;
    } catch (error) {
      throw error;
    }
  }

  static async getUserDashboardStats(userId: string): Promise<{
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalWatchTime: number; // in minutes
    averageProgress: number;
    recentActivity: IProgress[];
  }> {
    try {
      const progressList = await Progress.find({ userId })
        .populate('courseId', 'title thumbnail');

      const totalCourses = progressList.length;
      const completedCourses = progressList.filter(p => p.isCompleted).length;
      const inProgressCourses = progressList.filter(p => !p.isCompleted && p.completedLectures > 0).length;

      // Calculate total watch time from all lectures
      let totalWatchTime = 0;
      for (const progress of progressList) {
        for (const module of progress.modules) {
          for (const lecture of module.lectures) {
            totalWatchTime += lecture.watchTime / 60; // Convert seconds to minutes
          }
        }
      }

      const averageProgress = totalCourses > 0 
        ? progressList.reduce((sum, p) => sum + p.progressPercentage, 0) / totalCourses
        : 0;

      const recentActivity = progressList
        .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime())
        .slice(0, 5);

      return {
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalWatchTime: Math.round(totalWatchTime),
        averageProgress: Math.round(averageProgress),
        recentActivity,
      };
    } catch (error) {
      throw error;
    }
  }

  static async bulkUpdateProgress(
    userId: string,
    courseId: string,
    updates: IUpdateProgressRequest[]
  ): Promise<IProgress> {
    try {
      let progress = await Progress.findOne({ userId, courseId });

      if (!progress) {
        progress = await this.initializeProgress(userId, courseId);
      }

      // Apply all updates
      for (const update of updates) {
        await progress.updateLectureProgress(
          update.lectureId,
          update.watchTime,
          update.isCompleted
        );
      }

      return progress;
    } catch (error) {
      throw error;
    }
  }
}