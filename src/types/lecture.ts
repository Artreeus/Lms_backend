import { Document, ObjectId } from 'mongoose';

export interface IPDFNote {
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface ILecture extends Document {
  _id: string;
  title: string;
  videoUrl: string;
  duration: number; // in minutes
  moduleId: ObjectId;
  courseId: ObjectId;
  lectureNumber: number;
  pdfNotes: IPDFNote[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateLectureRequest {
  title: string;
  videoUrl: string;
  duration: number;
  moduleId: string;
  courseId: string;
  lectureNumber?: number;
}

export interface IUpdateLectureRequest {
  title?: string;
  videoUrl?: string;
  duration?: number;
  lectureNumber?: number;
  isActive?: boolean;
}

export interface ILectureResponse {
  success: boolean;
  message: string;
  data?: ILecture | ILecture[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ILectureQuery {
  page?: number;
  limit?: number;
  courseId?: string;
  moduleId?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: 'lectureNumber' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}