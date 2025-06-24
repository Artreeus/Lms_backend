import { Document, ObjectId } from 'mongoose';

export interface ICourse extends Document {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  slug: string;
  isActive: boolean;
  createdBy: ObjectId;
  totalModules: number;
  totalLectures: number;
  totalDuration: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateCourseRequest {
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
}

export interface IUpdateCourseRequest {
  title?: string;
  description?: string;
  price?: number;
  thumbnail?: string;
  isActive?: boolean;
}

export interface ICourseResponse {
  success: boolean;
  message: string;
  data?: ICourse | ICourse[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ICourseQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'title' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}