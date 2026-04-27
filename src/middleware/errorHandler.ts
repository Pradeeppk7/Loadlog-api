import { Request, Response, NextFunction } from 'express';
import { GraphQLError } from 'graphql';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error implements AppError {
  statusCode = 500;
  isOperational = false;

  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  // Log the error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
  });

  // Handle GraphQL errors
  if (error instanceof GraphQLError) {
    statusCode = 400;
    message = error.message;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    statusCode = 400;
  }

  // Don't leak error details in production
  if (!error.isOperational && process.env['NODE_ENV'] === 'production') {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env['NODE_ENV'] === 'development' && { stack: error.stack }),
    },
  });
};

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
