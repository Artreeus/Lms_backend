import Lecture from '../models/Lecture';
import Module from '../models/Module';
import Course from '../models/Course';
import { ILecture, ICreateLectureRequest, IUpdateLectureRequest, ILectureQuery, IPDFNote } from '../types/lecture';
import { ERROR_MESSAGES } from '../utils/constants';

export class LectureService {
  static async createLecture(lectureData: ICreateLectureRequest): Promise<ILecture> {
    try {
      // Verify module and course exist
      const [module, course] = await Promise.all([
        Module.findById(lectureData.moduleId),
        Course.findById(lectureData.courseId),
      ]);

      if (!module) {
        throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
      }

      if (!course) {
        throw new Error(ERROR_MESSAGES.COURSE_NOT_FOUND);
      }

      // Verify module belongs to course
      if (module.courseId.toString() !== lectureData.courseId) {
        throw new Error('Module does not belong to the specified course');
      }

      const lecture = new Lecture(lectureData);
      await lecture.save();

      // Update module and course stats
      await module.calculateLectureStats();

      return lecture;
    } catch (error) {
      throw error;
    }
  }

  static async getAllLectures(query: ILectureQuery): Promise<{
    lectures: ILecture[];
    totalCount: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        courseId,
        moduleId,
        isActive,
        search,
        sortBy = 'lectureNumber',
        sortOrder = 'asc',
      } = query;

      // Build filter
      const filter: any = {};
      
      if (courseId) filter.courseId = courseId;
      if (moduleId) filter.moduleId = moduleId;
      if (isActive !== undefined) filter.isActive = isActive;
      
      if (search) {
        filter.title = { $regex: search, $options: 'i' };
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [lectures, totalCount] = await Lecture.findWithFilters(
        filter,
        page,
        limit,
        sort
      );

      const totalPages = Math.ceil(totalCount / limit);

      return {
        lectures,
        totalCount,
        totalPages,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getLectureById(lectureId: string): Promise<ILecture | null> {
    try {
      const lecture = await Lecture.findById(lectureId)
        .populate('moduleId', 'title moduleNumber')
        .populate('courseId', 'title');
      return lecture;
    } catch (error) {
      throw error;
    }
  }

  static async getLecturesByCourse(courseId: string): Promise<ILecture[]> {
    try {
      const lectures = await Lecture.findByCourse(courseId);
      return lectures;
    } catch (error) {
      throw error;
    }
  }

  static async getLecturesByModule(moduleId: string): Promise<ILecture[]> {
    try {
      const lectures = await Lecture.findByModule(moduleId);
      return lectures;
    } catch (error) {
      throw error;
    }
  }

  static async updateLecture(
    lectureId: string,
    updateData: IUpdateLectureRequest
  ): Promise<ILecture | null> {
    try {
      const lecture = await Lecture.findById(lectureId);
      
      if (!lecture) {
        throw new Error(ERROR_MESSAGES.LECTURE_NOT_FOUND);
      }

      // If lecture number is being updated, check for conflicts
      if (updateData.lectureNumber && updateData.lectureNumber !== lecture.lectureNumber) {
        const existingLecture = await Lecture.findOne({
          moduleId: lecture.moduleId,
          lectureNumber: updateData.lectureNumber,
          _id: { $ne: lectureId },
        });

        if (existingLecture) {
          throw new Error('Lecture number already exists in this module');
        }
      }

      const updatedLecture = await Lecture.findByIdAndUpdate(
        lectureId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('moduleId', 'title moduleNumber')
        .populate('courseId', 'title');

      // Update module stats if duration changed
      if (updateData.duration) {
        const module = await Module.findById(lecture.moduleId);
        if (module) {
          await module.calculateLectureStats();
        }
      }

      return updatedLecture;
    } catch (error) {
      throw error;
    }
  }

  static async deleteLecture(lectureId: string): Promise<boolean> {
    try {
      const lecture = await Lecture.findById(lectureId);
      
      if (!lecture) {
        throw new Error(ERROR_MESSAGES.LECTURE_NOT_FOUND);
      }

      // Delete the lecture
      await Lecture.findByIdAndDelete(lectureId);

      // Update module and course stats
      const module = await Module.findById(lecture.moduleId);
      if (module) {
        await module.calculateLectureStats();
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async addPDFNote(
    lectureId: string,
    pdfNote: Omit<IPDFNote, 'uploadedAt'>
  ): Promise<ILecture | null> {
    try {
      const lecture = await Lecture.findById(lectureId);
      
      if (!lecture) {
        throw new Error(ERROR_MESSAGES.LECTURE_NOT_FOUND);
      }

      await lecture.addPDFNote(pdfNote);
      return lecture;
    } catch (error) {
      throw error;
    }
  }

  static async removePDFNote(lectureId: string, noteId: string): Promise<ILecture | null> {
    try {
      const lecture = await Lecture.findById(lectureId);
      
      if (!lecture) {
        throw new Error(ERROR_MESSAGES.LECTURE_NOT_FOUND);
      }

      await lecture.removePDFNote(noteId);
      return lecture;
    } catch (error) {
      throw error;
    }
  }

  static async reorderLectures(
    moduleId: string,
    lectureIds: string[]
  ): Promise<ILecture[]> {
    try {
      const module = await Module.findById(moduleId);
      if (!module) {
        throw new Error(ERROR_MESSAGES.MODULE_NOT_FOUND);
      }

      // Verify all lectures belong to this module
      const lectures = await Lecture.find({
        _id: { $in: lectureIds },
        moduleId,
      });

      if (lectures.length !== lectureIds.length) {
        throw new Error('Some lectures do not belong to this module');
      }

      // Update lecture numbers
      const updatedLectures = [];
      for (let i = 0; i < lectureIds.length; i++) {
        const lecture = await Lecture.findByIdAndUpdate(
          lectureIds[i],
          { lectureNumber: i + 1 },
          { new: true }
        );
        if (lecture) {
          updatedLectures.push(lecture);
        }
      }

      return updatedLectures;
    } catch (error) {
      throw error;
    }
  }

  static async duplicateLecture(lectureId: string): Promise<ILecture> {
    try {
      const originalLecture = await Lecture.findById(lectureId);
      
      if (!originalLecture) {
        throw new Error(ERROR_MESSAGES.LECTURE_NOT_FOUND);
      }

      // Get the highest lecture number for this module
      const lastLecture = await Lecture.findOne({ moduleId: originalLecture.moduleId })
        .sort({ lectureNumber: -1 });

      const newLectureNumber = lastLecture ? lastLecture.lectureNumber + 1 : 1;

      // Create new lecture
      const duplicatedLecture = new Lecture({
        title: `${originalLecture.title} (Copy)`,
        videoUrl: originalLecture.videoUrl,
        duration: originalLecture.duration,
        moduleId: originalLecture.moduleId,
        courseId: originalLecture.courseId,
        lectureNumber: newLectureNumber,
        pdfNotes: originalLecture.pdfNotes,
        isActive: originalLecture.isActive,
      });

      await duplicatedLecture.save();

      // Update module stats
      const module = await Module.findById(originalLecture.moduleId);
      if (module) {
        await module.calculateLectureStats();
      }

      return duplicatedLecture;
    } catch (error) {
      throw error;
    }
  }

  static async searchLectures(
    courseId: string,
    searchTerm: string
  ): Promise<ILecture[]> {
    try {
      const lectures = await Lecture.find({
        courseId,
        isActive: true,
        title: { $regex: searchTerm, $options: 'i' },
      })
        .populate('moduleId', 'title moduleNumber')
        .sort({ 'moduleId.moduleNumber': 1, lectureNumber: 1 })
        .limit(20);

      return lectures;
    } catch (error) {
      throw error;
    }
  }
}