import mongoose, { Schema } from 'mongoose';
import { IModule } from '../types/module';

const moduleSchema = new Schema<IModule>(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      maxlength: [100, 'Module title cannot exceed 100 characters'],
    },
    moduleNumber: {
      type: Number,
      required: [true, 'Module number is required'],
      min: [1, 'Module number must be at least 1'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lectureCount: {
      type: Number,
      default: 0,
    },
    totalDuration: {
      type: Number,
      default: 0, // in minutes
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
moduleSchema.index({ courseId: 1, moduleNumber: 1 }, { unique: true });
moduleSchema.index({ courseId: 1 });
moduleSchema.index({ isActive: 1 });

// Virtual for lectures
moduleSchema.virtual('lectures', {
  ref: 'Lecture',
  localField: '_id',
  foreignField: 'moduleId',
  options: { sort: { lectureNumber: 1 } },
});

// Pre-save middleware to auto-increment module number
moduleSchema.pre('save', async function (next) {
  if (this.isNew && !this.moduleNumber) {
    try {
      const lastModule = await mongoose.model('Module')
        .findOne({ courseId: this.courseId })
        .sort({ moduleNumber: -1 });
      
      this.moduleNumber = lastModule ? lastModule.moduleNumber + 1 : 1;
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Post-save middleware to update course stats
moduleSchema.post('save', async function () {
  try {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.courseId);
    if (course) {
      await course.calculateStats();
    }
  } catch (error) {
    console.error('Error updating course stats:', error);
  }
});

// Post-remove middleware to update course stats
moduleSchema.post('findOneAndDelete', async function () {
  try {
    const Course = mongoose.model('Course');
    const course = await Course.findById(this.getQuery().courseId);
    if (course) {
      await course.calculateStats();
    }
  } catch (error) {
    console.error('Error updating course stats:', error);
  }
});

// Instance method to calculate lecture stats
moduleSchema.methods.calculateLectureStats = async function () {
  const Lecture = mongoose.model('Lecture');
  
  const stats = await Lecture.aggregate([
    { $match: { moduleId: this._id, isActive: true } },
    {
      $group: {
        _id: null,
        lectureCount: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
      },
    },
  ]);
  
  const lectureStats = stats[0] || { lectureCount: 0, totalDuration: 0 };
  
  this.lectureCount = lectureStats.lectureCount;
  this.totalDuration = lectureStats.totalDuration;
  
  await this.save();
  
  return lectureStats;
};

// Static method to find modules by course
moduleSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ courseId, isActive: true })
    .sort({ moduleNumber: 1 })
    .populate('lectures');
};

const Module = mongoose.model<IModule>('Module', moduleSchema);

export default Module;