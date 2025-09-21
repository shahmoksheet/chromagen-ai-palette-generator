// Request logging middleware

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      success: body?.success !== false,
    });
    
    return originalJson.call(this, body);
  };

  next();
}

/**
 * Error request logging middleware
 */
export function errorRequestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Override res.status to catch error responses
  const originalStatus = res.status;
  res.status = function(code: number) {
    if (code >= 400) {
      const duration = Date.now() - startTime;
      
      logger.warn('Request error', {
        method: req.method,
        path: req.path,
        statusCode: code,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
    
    return originalStatus.call(this, code);
  };

  next();
}

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        ip: req.ip,
      });
    }
    
    // Log memory usage for generation endpoints
    if (req.path.includes('/generate')) {
      const memUsage = process.memoryUsage();
      logger.debug('Memory usage after generation', {
        path: req.path,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      });
    }
  });

  next();
}