import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';
import { env } from '../config/env';

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found error handler - for routes that don't exist
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler - all errors end up here
 */
export const errorHandler = (
  err: Error | AppError | ZodError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Default status code
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;
  
  // Handle specific error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.format();
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Log error (with different levels based on status code)
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message}`, { 
      path: req.path,
      method: req.method,
      error: err.stack
    });
  } else if (statusCode >= 400) {
    logger.warn(`${statusCode} - ${message}`, { 
      path: req.path,
      method: req.method
    });
  }
  
  // Send error response
  res.status(statusCode).json({
    error: message,
    details: details,
    // Only include stack trace in development
    ...(env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
};