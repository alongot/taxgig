import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, isAppError } from '../utils/errors';
import { config } from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  console.error('Error:', {
    message: error.message,
    stack: config.nodeEnv === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle known operational errors
  if (isAppError(error)) {
    const response: Record<string, unknown> = {
      success: false,
      error: error.message,
    };

    // Include validation errors if present
    if (error instanceof ValidationError) {
      response.errors = error.errors;
    }

    // Include stack trace in development
    if (config.nodeEnv === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle unknown errors
  const statusCode = 500;
  const message = config.nodeEnv === 'production'
    ? 'Internal server error'
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && { stack: error.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
};
