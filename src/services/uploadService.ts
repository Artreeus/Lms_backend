import path from 'path';
import fs from 'fs';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import { getFileUrl } from '../middleware/upload';
import { Request } from 'express';

export class UploadService {
  static async uploadThumbnail(file: Express.Multer.File, req: Request): Promise<string> {
    try {
      // If Cloudinary is configured, upload to cloud
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await uploadToCloudinary(file.path, 'lms/thumbnails', 'image');
        
        // Delete local file after cloud upload
        this.deleteLocalFile(file.path);
        
        return result.url;
      }

      // Otherwise, return local file URL
      return getFileUrl(req, file.path);
    } catch (error) {
      // Delete local file if upload fails
      this.deleteLocalFile(file.path);
      throw error;
    }
  }

  static async uploadVideo(file: Express.Multer.File, req: Request): Promise<string> {
    try {
      // For videos, we typically use local storage or external video hosting
      // In production, you might want to upload to AWS S3, Google Cloud, etc.
      
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await uploadToCloudinary(file.path, 'lms/videos', 'video');
        
        // Delete local file after cloud upload
        this.deleteLocalFile(file.path);
        
        return result.url;
      }

      // Return local file URL
      return getFileUrl(req, file.path);
    } catch (error) {
      // Delete local file if upload fails
      this.deleteLocalFile(file.path);
      throw error;
    }
  }

  static async uploadPDF(file: Express.Multer.File, req: Request): Promise<{
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    url: string;
  }> {
    try {
      let fileUrl: string;
      
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const result = await uploadToCloudinary(file.path, 'lms/pdfs', 'raw');
        fileUrl = result.url;
        
        // Delete local file after cloud upload
        this.deleteLocalFile(file.path);
      } else {
        fileUrl = getFileUrl(req, file.path);
      }

      return {
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        url: fileUrl,
      };
    } catch (error) {
      // Delete local file if upload fails
      this.deleteLocalFile(file.path);
      throw error;
    }
  }

  static async uploadMultiplePDFs(
    files: Express.Multer.File[],
    req: Request
  ): Promise<Array<{
    fileName: string;
    originalName: string;
    filePath: string;
    fileSize: number;
    url: string;
  }>> {
    try {
      const uploadPromises = files.map(file => this.uploadPDF(file, req));
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      // Clean up files on error
      files.forEach(file => this.deleteLocalFile(file.path));
      throw error;
    }
  }

  static deleteLocalFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting local file:', error);
    }
  }

  static async deleteCloudFile(url: string): Promise<void> {
    try {
      if (url.includes('cloudinary.com')) {
        // Extract public ID from Cloudinary URL
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        const publicId = filename.split('.')[0];
        
        await deleteFromCloudinary(publicId);
      }
    } catch (error) {
      console.error('Error deleting cloud file:', error);
    }
  }

  static validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  static validateFileSize(file: Express.Multer.File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${baseName}-${timestamp}-${random}${extension}`;
  }

  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  static async cleanupOrphanedFiles(): Promise<void> {
    try {
      // This method can be used to clean up files that are no longer referenced
      // in the database. You might want to run this as a scheduled job.
      
      const uploadDirs = [
        'uploads/thumbnails',
        'uploads/videos',
        'uploads/pdfs',
      ];

      for (const dir of uploadDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          
          for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            // Delete files older than 7 days that might be orphaned
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
            if (stats.mtime < sevenDaysAgo) {
              // Here you would typically check if the file is still referenced
              // in your database before deleting
              console.log(`Found old file: ${filePath}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}