import mongoose, { Schema } from 'mongoose';
import { ILecture, IPDFNote } from '../types/lecture';

const pdfNoteSchema = new Schema<IPDFNote>(
  {
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const lectureSchema = new Schema<ILecture>(
  {
    title: {
      type: String,
      required: [true, 'Lecture title is required'],
      trim: true,
      maxlength: [100, 'Lecture title cannot exceed 100 characters'],
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Lecture duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module ID is required'],
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    lectureNumber: {
      type: Number,
      required: [true, 'Lecture number is required'],
      min: [1, 'Lecture number must be at least 1'],
    },
    pdfNotes: [pdfNoteSchema],
    isActive: {
      type: Boolean,
      default: true,
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
lectureSchema.index({ moduleId: 1, lectureNumber: 1 }, { unique: true });
lectureSchema.index({ courseId: 1 });
lectureSchema.index({ moduleId: 1 });
lectureSchema.index({ isActive: 1 });
lectureSchema.index({ title: 'text' });

// Pre-save middleware to auto-increment lecture number
lectureSchema.pre('save', async function (next) {
  if (this.isNew && !this.lectureNumber) {
    try {
      const lastLecture = await mongoose.model('Lecture')
        .findOne({ moduleId: this.moduleId })
        .sort({ lectureNumber: -1 });
      
      this.lectureNumber = lastLecture ? lastLecture.lectureNumber + 1 : 1;
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Post-save middleware to update module and course stats
lectureSchema.post('save', async function () {
  try {
    const Module = mongoose.model('Module');
    const module = await Module.findById(this.moduleId);
    if (module) {
      await module.calculateLectureStats();
    }
  } catch (error) {
    console.error('Error updating module stats:', error);
  }
});

// Post-remove middleware to update module and course stats
lectureSchema.post('findOneAndDelete', async function () {
  try {
    const Module = mongoose.model('Module');
    const module = await Module.findById(this.getQuery().moduleId);
    if (module) {
      await module.calculateLectureStats();
    }
  } catch (error) {
    console.error('Error updating module stats:', error);
  }
});

// Static method to find lectures with pagination and filters
lectureSchema.statics.findWithFilters = function (
  filter: any = {},
  page: number = 1,
  limit: number = 10,
  sort: any = { lectureNumber: 1 }
) {
  const skip = (page - 1) * limit;
  
  return Promise.all([
    this.find(filter)
      .populate('moduleId', 'title moduleNumber')
      .populate('courseId', 'title')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(filter),
  ]);
};

// Static method to find lectures by course
lectureSchema.statics.findByCourse = function (courseId: string) {
  return this.find({ courseId, isActive: true })
    .populate('moduleId', 'title moduleNumber')
    .sort({ 'moduleId.moduleNumber': 1, lectureNumber: 1 });
};

// Static method to find lectures by module
lectureSchema.statics.findByModule = function (moduleId: string) {
  return this.find({ moduleId, isActive: true })
    .sort({ lectureNumber: 1 });
};

// Instance method to add PDF note
lectureSchema.methods.addPDFNote = function (pdfNote: Omit<IPDFNote, 'uploadedAt'>) {
  this.pdfNotes.push({
    ...pdfNote,
    uploadedAt: new Date(),
  });
  return this.save();
};

// Instance method to remove PDF note
lectureSchema.methods.removePDFNote = function (noteId: string) {
  this.pdfNotes = this.pdfNotes.filter(note => note._id?.toString() !== noteId);
  return this.save();
};

const Lecture = mongoose.model<ILecture>('Lecture', lectureSchema);

export default Lecture;