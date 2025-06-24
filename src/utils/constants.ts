export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    PDF: 10 * 1024 * 1024, // 10MB
  },
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    VIDEO: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    PDF: ['application/pdf'],
  },
  PATHS: {
    THUMBNAILS: 'uploads/thumbnails/',
    VIDEOS: 'uploads/videos/',
    PDFS: 'uploads/pdfs/',
  },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const JWT_CONFIG = {
  EXPIRES_IN: '7d',
  ALGORITHM: 'HS256',
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long',
  INVALID_OBJECT_ID: 'Invalid ID format',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
} as const;

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  COURSE_NOT_FOUND: 'Course not found',
  MODULE_NOT_FOUND: 'Module not found',
  LECTURE_NOT_FOUND: 'Lecture not found',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access forbidden',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
} as const;

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  COURSE_CREATED: 'Course created successfully',
  COURSE_UPDATED: 'Course updated successfully',
  COURSE_DELETED: 'Course deleted successfully',
  MODULE_CREATED: 'Module created successfully',
  MODULE_UPDATED: 'Module updated successfully',
  MODULE_DELETED: 'Module deleted successfully',
  LECTURE_CREATED: 'Lecture created successfully',
  LECTURE_UPDATED: 'Lecture updated successfully',
  LECTURE_DELETED: 'Lecture deleted successfully',
  PROGRESS_UPDATED: 'Progress updated successfully',
  FILE_UPLOADED: 'File uploaded successfully',
} as const;