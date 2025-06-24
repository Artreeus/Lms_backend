import { Document, ObjectId } from 'mongoose';

export interface ILectureProgress {
  lectureId: ObjectId;
  completedAt: Date;
  watchTime: number; // in seconds
  isCompleted: boolean;
}

export interface IModuleProgress {
  moduleId: ObjectId;
  lectures: ILectureProgress[];
  completedLectures: number;
  totalLectures: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface IProgress extends Document {
  _id: string;
  userId: ObjectId;
  courseId: ObjectId;
  modules: IModuleProgress[];
  completedModules: number;
  totalModules: number;
  completedLectures: number;
  totalLectures: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedAt?: Date;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUpdateProgressRequest {
  lectureId: string;
  watchTime?: number;
  isCompleted?: boolean;
}

export interface IProgressResponse {
  success: boolean;
  message: string;
  data?: IProgress | IProgress[];
}

export interface IProgressQuery {
  userId?: string;
  courseId?: string;
  isCompleted?: boolean;
}