import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { FILE_UPLOAD } from '../utils/constants';

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    FILE_UPLOAD.PATHS.THUMBNAILS,
    FILE_UPLOAD.PATHS.VIDEOS,
    FILE_UPLOAD.PATHS.PDFS,
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let uploadPath = 'uploads/';

    if (file.fieldname === 'thumbnail') {
      uploadPath = FILE_UPLOAD.PATHS.THUMBNAILS;
    } else if (file.fieldname === 'video') {
      uploadPath = FILE_UPLOAD.PATHS.VIDEOS;
    } else if (file.fieldname === 'pdfNotes') {
      uploadPath = FILE_UPLOAD.PATHS.PDFS;
    }

    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${extension}`;
    cb(null, filename);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  let allowedTypes: string[] = [];
  let maxSize: number = 0;

  switch (file.fieldname) {
    case 'thumbnail':
      allowedTypes = FILE_UPLOAD.ALLOWED_TYPES.IMAGE;
      maxSize = FILE_UPLOAD.MAX_SIZE.IMAGE;
      break;
    case 'video':
      allowedTypes = FILE_UPLOAD.ALLOWED_TYPES.VIDEO;
      maxSize = FILE_UPLOAD.MAX_SIZE.VIDEO;
      break;
    case 'pdfNotes':
      allowedTypes = FILE_UPLOAD.ALLOWED_TYPES.PDF;
      maxSize = FILE_UPLOAD.MAX_SIZE.PDF;
      break;
    default:
      return cb(new Error('Invalid field name'));
  }

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${allowedTypes.join(', ')}`));
  }

  cb(null, true);
};

// Base multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE.VIDEO, // Use largest size as general limit
  },
});

// Specific upload configurations
export const uploadThumbnail = upload.single('thumbnail');
export const uploadVideo = upload.single('video');
export const uploadPDFs = upload.array('pdfNotes', 5); // Allow up to 5 PDF files
export const uploadCourseMaterials = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'pdfNotes', maxCount: 5 },
]);

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        details: `Maximum file size is ${FILE_UPLOAD.MAX_SIZE.VIDEO / (1024 * 1024)}MB`,
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        details: 'Maximum 5 PDF files allowed',
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field',
        details: 'Only thumbnail, video, and pdfNotes fields are allowed',
      });
    }
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      message: 'Upload error',
      details: error.message,
    });
  }

  next(error);
};

// Utility function to delete uploaded file
export const deleteUploadedFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Utility function to get file URL
export const getFileUrl = (req: Request, filePath: string): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};