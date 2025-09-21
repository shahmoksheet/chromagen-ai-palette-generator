// Request validation middleware

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../types/api';
import { logger } from '../utils/logger';

/**
 * Middleware factory for validating request bodies
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        logger.warn('Request body validation failed', {
          path: req.path,
          method: req.method,
          errors: formattedErrors,
        });
        
        const validationError = new ValidationError(
          'Request body validation failed',
          { errors: formattedErrors }
        );
        
        return res.status(validationError.statusCode).json({
          success: false,
          error: validationError.message,
          code: validationError.code,
          details: validationError.details,
        });
      }
      
      next(error);
    }
  };
}

/**
 * Middleware factory for validating query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        logger.warn('Query parameter validation failed', {
          path: req.path,
          method: req.method,
          errors: formattedErrors,
        });
        
        const validationError = new ValidationError(
          'Query parameter validation failed',
          { errors: formattedErrors }
        );
        
        return res.status(validationError.statusCode).json({
          success: false,
          error: validationError.message,
          code: validationError.code,
          details: validationError.details,
        });
      }
      
      next(error);
    }
  };
}

/**
 * Middleware factory for validating route parameters
 */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        logger.warn('Route parameter validation failed', {
          path: req.path,
          method: req.method,
          errors: formattedErrors,
        });
        
        const validationError = new ValidationError(
          'Route parameter validation failed',
          { errors: formattedErrors }
        );
        
        return res.status(validationError.statusCode).json({
          success: false,
          error: validationError.message,
          code: validationError.code,
          details: validationError.details,
        });
      }
      
      next(error);
    }
  };
}