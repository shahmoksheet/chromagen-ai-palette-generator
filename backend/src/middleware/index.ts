// Middleware setup

import express from 'express';
import { helmetConfig, generalRateLimit, requestSizeLimit } from './security';
import { corsMiddleware } from './cors';
import { requestLogger, errorRequestLogger, performanceMonitor } from './logging';
import { errorHandler, notFoundHandler } from './errorHandler';
import { logger } from '../utils/logger';

export function setupMiddleware(app: express.Application): void {
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmetConfig);
  app.use(corsMiddleware);

  // Request logging and monitoring
  app.use(requestLogger);
  app.use(errorRequestLogger);
  app.use(performanceMonitor);

  // Body parsing with size limits
  app.use(express.json(requestSizeLimit.json));
  app.use(express.urlencoded(requestSizeLimit.urlencoded));

  // General rate limiting
  app.use('/api/', generalRateLimit);

  // Health check endpoint (before rate limiting)
  app.get('/health', (req, res) => {
    const memUsage = process.memoryUsage();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      },
    });
  });

  // API info endpoint
  app.get('/api', (req, res) => {
    res.json({
      name: 'ChromaGen API',
      version: '1.0.0',
      description: 'AI-powered color palette generator with accessibility compliance',
      documentation: 'https://github.com/your-repo/chromagen#api-documentation',
      endpoints: {
        health: '/health',
        generate: {
          text: 'POST /api/generate/text',
          image: 'POST /api/generate/image',
        },
        palettes: {
          history: 'GET /api/palettes/history/:userId',
          save: 'POST /api/palettes/save',
          delete: 'DELETE /api/palettes/:id',
          export: 'GET /api/palettes/:id/export/:format',
        },
      },
      rateLimit: {
        general: '100 requests per 15 minutes',
        generation: '10 requests per minute',
        upload: '5 uploads per minute',
      },
    });
  });
}

export function setupErrorHandling(app: express.Application): void {
  // 404 handler for unmatched routes
  app.use('*', notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);
}