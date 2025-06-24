import Module from '../models/Module';
import Course from '../models/Course';
import Lecture from '../models/Lecture';
import { IModule, ICreateModuleRequest, IUpdateModuleRequest, IModuleQuery } from '../types/module';
import { ERROR_MESSAGES } from '../utils/constants';

export class ModuleService {
  static async createModule(moduleData: ICreateModuleRequest): Promise<IModule> {
    try {
      // Verify course exists
      const course = await Course.findById(moduleData.courseId);
      if (!course) {
        throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
      }

      const module = new Module(moduleData);
      await module.save();

      // Update course stats
      await course.calculateStats();

      return module;
    } catch (error) {
      throw error;
    }
  }

  static async getModulesByCourse(courseId: string): Promise<IModule[]> {
    try {
      const modules = await Module.findByCourse(courseId);
      return modules;
    } catch (error) {
      throw error;
    }
  }

  static async getModuleById(moduleId: string): Promise<IModule | null> {
    try {
      const module = await Module.findById(moduleId)
        .populate('courseId', 'title')
        .populate('lectures');
      return module;
    } catch (error) {
      throw error;
    }
  }

  static async updateModule(
    moduleId: string,
    updateData: IUpdateModuleRequest
  ): Promise<IModule | null> {
    try {
      const module = await Module.findById(moduleId);
      
      if (!module) {
        throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
      }

      // If module number is being updated, check for conflicts
      if (updateData.moduleNumber && updateData.moduleNumber !== module.moduleNumber) {
        const existingModule = await Module.findOne({
          courseId: module.courseId,
          moduleNumber: updateData.moduleNumber,
          _id: { $ne: moduleId },
        });

        if (existingModule) {
          throw new Error('Module number already exists in this course');
        }
      }

      const updatedModule = await Module.findByIdAndUpdate(
        moduleId,
        updateData,
        { new: true, runValidators: true }
      ).populate('courseId', 'title');

      return updatedModule;
    } catch (error) {
      throw error;
    }
  }

  static async deleteModule(moduleId: string): Promise<boolean> {
    try {
      const module = await Module.findById(moduleId);
      
      if (!module) {
        throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
      }

      // Delete all lectures in this module
      await Lecture.deleteMany({ moduleId });

      // Delete the module
      await Module.findByIdAndDelete(moduleId);

      // Update course stats
      const course = await Course.findById(module.courseId);
      if (course) {
        await course.calculateStats();
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getModuleWithLectures(moduleId: string): Promise<any> {
    try {
      const module = await Module.findById(moduleId)
        .populate('courseId', 'title')
        .lean();

      if (!module) {
        throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
      }

      const lectures = await Lecture.find({ moduleId, isActive: true })
        .sort({ lectureNumber: 1 })
        .lean();

      return {
        ...module,
        lectures,
      };
    } catch (error) {
      throw error;
    }
  }

  static async reorderModules(
    courseId: string,
    moduleIds: string[]
  ): Promise<IModule[]> {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
      }

      // Verify all modules belong to this course
      const modules = await Module.find({
        _id: { $in: moduleIds },
        courseId,
      });

      if (modules.length !== moduleIds.length) {
        throw new Error('Some modules do not belong to this course');
      }

      // Update module numbers
      const updatedModules = [];
      for (let i = 0; i < moduleIds.length; i++) {
        const module = await Module.findByIdAndUpdate(
          moduleIds[i],
          { moduleNumber: i + 1 },
          { new: true }
        );
        if (module) {
          updatedModules.push(module);
        }
      }

      return updatedModules;
    } catch (error) {
      throw error;
    }
  }

  static async duplicateModule(moduleId: string): Promise<IModule> {
    try {
      const originalModule = await Module.findById(moduleId);
      
      if (!originalModule) {
        throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
      }

      // Get the highest module number for this course
      const lastModule = await Module.findOne({ courseId: originalModule.courseId })
        .sort({ moduleNumber: -1 });

      const newModuleNumber = lastModule ? lastModule.moduleNumber + 1 : 1;

      // Create new module
      const duplicatedModule = new Module({
        title: `${originalModule.title} (Copy)`,
        moduleNumber: newModuleNumber,
        courseId: originalModule.courseId,
        isActive: originalModule.isActive,
      });

      await duplicatedModule.save();

      // Duplicate lectures
      const originalLectures = await Lecture.find({ moduleId: originalModule._id });
      
      for (const lecture of originalLectures) {
        const duplicatedLecture = new Lecture({
          title: lecture.title,
          videoUrl: lecture.videoUrl,
          duration: lecture.duration,
          moduleId: duplicatedModule._id,
          courseId: lecture.courseId,
          pdfNotes: lecture.pdfNotes,
          isActive: lecture.isActive,
        });

        await duplicatedLecture.save();
      }

      // Update course stats
      const course = await Course.findById(originalModule.courseId);
      if (course) {
        await course.calculateStats();
      }

      return duplicatedModule;
    } catch (error) {
      throw error;
    }
  }
}