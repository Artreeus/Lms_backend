import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: { [key: string]: any };
  errors?: { [key: string]: any };
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  let details: any = null;

  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Mongoose validation error
  if (error instanceof MongooseError.ValidationError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Validation Error';
    details = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
  }

  // Mongoose cast error (invalid ObjectId)
  if (error instanceof MongooseError.CastError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid ID format';
    details = `Invalid ${error.path}: ${error.value}`;
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    message = 'Duplicate field value';
    const field = Object.keys(error.keyValue || {})[0];
    details = `${field} already exists`;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token expired';
  }

  // Multer errors are handled in upload middleware
  
  // Send error response
  const response: any = {
    success: false,
    message,
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Route ${req.originalUrl} not found`) as CustomError;
  error.statusCode = HTTP_STATUS.NOT_FOUND;
  next(error);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};