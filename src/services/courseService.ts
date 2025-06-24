import Course from '../models/Course';
import Module from '../models/Module';
import Lecture from '../models/Lecture';
import { ICourse, ICreateCourseRequest, IUpdateCourseRequest, ICourseQuery } from '../types/course';
import { ERROR_MESSAGES } from '../utils/constants';

export class CourseService {
  static async createCourse(courseData: ICreateCourseRequest, createdBy: string): Promise<ICourse> {
    try {
      const course = new Course({
        ...courseData,
        createdBy,
      });

      await course.save();
      return course;
    } catch (error) {
      throw error;
    }
  }

  static async getAllCourses(query: ICourseQuery): Promise<{
    courses: ICourse[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isActive,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      // Build filter
      const filter: any = {};
      
      if (isActive !== undefined) {
        filter.isActive = isActive;
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [courses, totalCount] = await Course.findWithPagination(
        filter,
        page,
        limit,
        sort
      );

      const totalPages = Math.ceil(totalCount / limit);

      return {
        courses,
        totalCount,
        totalPages,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getCourseById(courseId: string): Promise<ICourse | null> {
    try {
      const course = await Course.findById(courseId)
        .populate('createdBy', 'firstName lastName email');
      return course;
    } catch (error) {
      throw error;
    }
  }

  static async getCourseBySlug(slug: string): Promise<ICourse | null> {
    try {
      const course = await Course.findOne({ slug, isActive: true })
        .populate('createdBy', 'firstName lastName email');
      return course;
    } catch (error) {
      throw error;
    }
  }

  static async updateCourse(
    courseId: string,
    updateData: IUpdateCourseRequest,
    userId: string
  ): Promise<ICourse | null> {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
      }

      // Check if user is the creator or admin
      if (course.createdBy.toString() !== userId) {
        // You might want to check if user is admin here
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'firstName lastName email');

      return updatedCourse;
    } catch (error) {
      throw error;
    }
  }

  static async deleteCourse(courseId: string, userId: string): Promise<boolean> {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
      }

      // Check if user is the creator or admin
      if (course.createdBy.toString() !== userId) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      // Delete related modules and lectures
      const modules = await Module.find({ courseId });
      const moduleIds = modules.map(module => module._id);
      
      await Lecture.deleteMany({ moduleId: { $in: moduleIds } });
      await Module.deleteMany({ courseId });
      await Course.findByIdAndDelete(courseId);

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getCourseWithContent(courseId: string): Promise<any> {
    try {
      const course = await Course.findById(courseId)
        .populate('createdBy', 'firstName lastName email');

      if (!course) {
        throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
      }

      const modules = await Module.find({ courseId, isActive: true })
        .sort({ moduleNumber: 1 })
        .lean();

      const moduleIds = modules.map(module => module._id);
      const lectures = await Lecture.find({ 
        moduleId: { $in: moduleIds }, 
        isActive: true 
      })
        .sort({ lectureNumber: 1 })
        .lean();

      // Group lectures by module
      const modulesWithLectures = modules.map(module => ({
        ...module,
        lectures: lectures.filter(lecture => 
          lecture.moduleId.toString() === module._id.toString()
        ),
      }));

      return {
        ...course.toObject(),
        modules: modulesWithLectures,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getPublicCourses(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{
    courses: ICourse[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      const filter: any = { isActive: true };
      
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const [courses, totalCount] = await Course.findWithPagination(
        filter,
        page,
        limit,
        { createdAt: -1 }
      );

      const totalPages = Math.ceil(totalCount / limit);

      return {
        courses,
        totalCount,
        totalPages,
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateCourseStats(courseId: string): Promise<void> {
    try {
      const course = await Course.findById(courseId);
      if (course) {
        await course.calculateStats();
      }
    } catch (error) {
      throw error;
    }
  }
}