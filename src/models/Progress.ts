import mongoose, { Schema } from 'mongoose';
import { IProgress, ILectureProgress, IModuleProgress } from '../types/progress';

const lectureProgressSchema = new Schema<ILectureProgress>(
  {
    lectureId: {
      type: Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
    },
    completedAt: {
      type: Date,
    },
    watchTime: {
      type: Number,
      default: 0, // in seconds
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const moduleProgressSchema = new Schema<IModuleProgress>(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    lectures: [lectureProgressSchema],
    completedLectures: {
      type: Number,
      default: 0,
    },
    totalLectures: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const progressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    modules: [moduleProgressSchema],
    completedModules: {
      type: Number,
      default: 0,
    },
    totalModules: {
      type: Number,
      default: 0,
    },
    completedLectures: {
      type: Number,
      default: 0,
    },
    totalLectures: {
      type: Number,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
progressSchema.index({ userId: 1 });
progressSchema.index({ courseId: 1 });

// Method to initialize progress for a course
progressSchema.statics.initializeForCourse = async function (userId: string, courseId: string) {
  const Module = mongoose.model('Module');
  const Lecture = mongoose.model('Lecture');
  
  // Get all modules and lectures for the course
  const modules = await Module.find({ courseId, isActive: true }).sort({ moduleNumber: 1 });
  const lectures = await Lecture.find({ courseId, isActive: true }).sort({ lectureNumber: 1 });
  
  // Build module progress structure
  const moduleProgress: IModuleProgress[] = [];
  let totalLectures = 0;
  
  for (const module of modules) {
    const moduleLectures = lectures.filter(lecture => 
      lecture.moduleId.toString() === module._id.toString()
    );
    
    const lectureProgress: ILectureProgress[] = moduleLectures.map(lecture => ({
      lectureId: lecture._id,
      completedAt: undefined,
      watchTime: 0,
      isCompleted: false,
    }));
    
    moduleProgress.push({
      moduleId: module._id,
      lectures: lectureProgress,
      completedLectures: 0,
      totalLectures: moduleLectures.length,
      isCompleted: false,
    });
    
    totalLectures += moduleLectures.length;
  }
  
  // Create or update progress document
  const progress = await this.findOneAndUpdate(
    { userId, courseId },
    {
      modules: moduleProgress,
      completedModules: 0,
      totalModules: modules.length,
      completedLectures: 0,
      totalLectures,
      progressPercentage: 0,
      isCompleted: false,
      lastAccessedAt: new Date(),
    },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true 
    }
  );
  
  return progress;
};

// Method to update lecture progress
progressSchema.methods.updateLectureProgress = function (
  lectureId: string, 
  watchTime?: number, 
  isCompleted?: boolean
) {
  // Find the module containing this lecture
  const moduleIndex = this.modules.findIndex(module =>
    module.lectures.some(lecture => lecture.lectureId.toString() === lectureId)
  );
  
  if (moduleIndex === -1) {
    throw new Error('Lecture not found in progress');
  }
  
  const module = this.modules[moduleIndex];
  const lectureIndex = module.lectures.findIndex(
    lecture => lecture.lectureId.toString() === lectureId
  );
  
  if (lectureIndex === -1) {
    throw new Error('Lecture not found in module');
  }
  
  const lecture = module.lectures[lectureIndex];
  
  // Update lecture progress
  if (watchTime !== undefined) {
    lecture.watchTime = watchTime;
  }
  
  if (isCompleted !== undefined) {
    lecture.isCompleted = isCompleted;
    if (isCompleted && !lecture.completedAt) {
      lecture.completedAt = new Date();
    } else if (!isCompleted) {
      lecture.completedAt = undefined;
    }
  }
  
  // Recalculate module progress
  const completedLectures = module.lectures.filter(l => l.isCompleted).length;
  module.completedLectures = completedLectures;
  module.isCompleted = completedLectures === module.totalLectures;
  
  if (module.isCompleted && !module.completedAt) {
    module.completedAt = new Date();
  } else if (!module.isCompleted) {
    module.completedAt = undefined;
  }
  
  // Recalculate overall progress
  this.completedLectures = this.modules.reduce((total, mod) => total + mod.completedLectures, 0);
  this.completedModules = this.modules.filter(mod => mod.isCompleted).length;
  
  this.progressPercentage = this.totalLectures > 0 
    ? Math.round((this.completedLectures / this.totalLectures) * 100)
    : 0;
  
  this.isCompleted = this.completedModules === this.totalModules;
  
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  } else if (!this.isCompleted) {
    this.completedAt = undefined;
  }
  
  this.lastAccessedAt = new Date();
  
  return this.save();
};

// Method to get next unlocked lecture
progressSchema.methods.getNextUnlockedLecture = function () {
  for (const module of this.modules) {
    for (let i = 0; i < module.lectures.length; i++) {
      const lecture = module.lectures[i];
      
      // If this lecture is not completed, it's the next one to unlock
      if (!lecture.isCompleted) {
        // Check if previous lecture is completed (for sequential unlock)
        if (i === 0) {
          return lecture.lectureId; // First lecture is always unlocked
        }
        
        const previousLecture = module.lectures[i - 1];
        if (previousLecture.isCompleted) {
          return lecture.lectureId;
        } else {
          return previousLecture.lectureId; // Return previous incomplete lecture
        }
      }
    }
  }
  
  return null; // All lectures completed
};

// Method to check if lecture is unlocked
progressSchema.methods.isLectureUnlocked = function (lectureId: string) {
  const nextUnlocked = this.getNextUnlockedLecture();
  
  if (!nextUnlocked) return true; // All completed, so all unlocked
  
  // Find the lecture in question
  for (const module of this.modules) {
    for (let i = 0; i < module.lectures.length; i++) {
      const lecture = module.lectures[i];
      
      if (lecture.lectureId.toString() === lectureId) {
        // Check if this lecture or any previous lecture is the next unlocked
        for (let j = 0; j <= i; j++) {
          if (module.lectures[j].lectureId.toString() === nextUnlocked.toString()) {
            return true;
          }
        }
        return lecture.isCompleted; // Return true if already completed
      }
    }
  }
  
  return false;
};

const Progress = mongoose.model<IProgress>('Progress', progressSchema);

export default Progress;