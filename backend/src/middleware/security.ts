// Security middleware configuration

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { getEnvVarAsNumber } from '../utils/environment';
import { logger } from '../utils/logger';

/**
 * Helmet security configuration
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow image uploads
});

/**
 * Rate limiting configuration
 */
const rateLimitWindowMs = getEnvVarAsNumber('RATE_LIMIT_WINDOW_MS', 900000); // 15 minutes
const rateLimitMaxRequests = getEnvVarAsNumber('RATE_LIMIT_MAX_REQUESTS', 100);

export const generalRateLimit = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(rateLimitWindowMs / 1000),
    });
  },
});

/**
 * Stricter rate limiting for generation endpoints
 */
export const generationRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    error: 'Too many generation requests. Please wait before generating more palettes.',
    code: 'GENERATION_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Generation rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many generation requests. Please wait before generating more palettes.',
      code: 'GENERATION_RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
    });
  },
});

/**
 * File upload rate limiting
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // 5 uploads per minute
  message: {
    success: false,
    error: 'Too many file uploads. Please wait before uploading more images.',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many file uploads. Please wait before uploading more images.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
    });
  },
});

/**
 * Request size limiting middleware
 */
export const requestSizeLimit = {
  json: { limit: '10mb' },
  urlencoded: { extended: true, limit: '10mb' },
};