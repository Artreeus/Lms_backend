import { Document, ObjectId } from 'mongoose';

export interface IModule extends Document {
  _id: string;
  title: string;
  moduleNumber: number;
  courseId: ObjectId;
  isActive: boolean;
  lectureCount: number;
  totalDuration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateModuleRequest {
  title: string;
  courseId: string;
  moduleNumber?: number;
}

export interface IUpdateModuleRequest {
  title?: string;
  moduleNumber?: number;
  isActive?: boolean;
}

export interface IModuleResponse {
  success: boolean;
  message: string;
  data?: IModule | IModule[];
}

export interface IModuleQuery {
  courseId?: string;
  isActive?: boolean;
  sortBy?: 'moduleNumber' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}