import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';
import { ICourse } from '../types/course';

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [100, 'Course title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      maxlength: [1000, 'Course description cannot exceed 1000 characters'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalModules: {
      type: Number,
      default: 0,
    },
    totalLectures: {
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
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ createdBy: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
courseSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }
  next();
});

// Virtual for modules
courseSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'courseId',
});

// Static method to find courses with pagination
courseSchema.statics.findWithPagination = function (
  filter: any = {},
  page: number = 1,
  limit: number = 10,
  sort: any = { createdAt: -1 }
) {
  const skip = (page - 1) * limit;
  
  return Promise.all([
    this.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(filter),
  ]);
};

// Instance method to calculate stats
courseSchema.methods.calculateStats = async function () {
  const Module = mongoose.model('Module');
  const Lecture = mongoose.model('Lecture');
  
  // Get total modules
  const totalModules = await Module.countDocuments({ courseId: this._id, isActive: true });
  
  // Get total lectures and duration
  const lectureStats = await Lecture.aggregate([
    { $match: { courseId: this._id, isActive: true } },
    {
      $group: {
        _id: null,
        totalLectures: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
      },
    },
  ]);
  
  const stats = lectureStats[0] || { totalLectures: 0, totalDuration: 0 };
  
  // Update course stats
  this.totalModules = totalModules;
  this.totalLectures = stats.totalLectures;
  this.totalDuration = stats.totalDuration;
  
  await this.save();
  
  return {
    totalModules,
    totalLectures: stats.totalLectures,
    totalDuration: stats.totalDuration,
  };
};

const Course = mongoose.model<ICourse>('Course', courseSchema);

export default Course;