// Error logging endpoints for frontend error reporting

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validation';
import { generalRateLimit } from '../middleware/security';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schema for error logs
const ErrorLogSchema = z.object({
  logs: z.array(z.object({
    level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']),
    message: z.string(),
    timestamp: z.string(),
    fingerprint: z.string(),
    context: z.object({
      errorId: z.string().optional(),
      userId: z.string().optional(),
      sessionId: z.string().optional(),
      url: z.string().optional(),
      userAgent: z.string().optional(),
      componentStack: z.string().optional(),
      errorBoundary: z.boolean().optional(),
      retryCount: z.number().optional(),
      action: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
    error: z.object({
      name: z.string().optional(),
      message: z.string().optional(),
      stack: z.string().optional(),
    }).optional(),
  })),
});

/**
 * POST /api/logs/errors
 * Accept error logs from frontend
 */
router.post('/errors', 
  generalRateLimit,
  validateBody(ErrorLogSchema),
  asyncHandler(async (req, res) => {
    const { logs } = req.body;

    // Process each log entry
    for (const logEntry of logs) {
      const logLevel = logEntry.level === 'fatal' ? 'error' : logEntry.level;
      
      // Create structured log entry
      const structuredLog = {
        message: logEntry.message,
        level: logLevel,
        timestamp: logEntry.timestamp,
        fingerprint: logEntry.fingerprint,
        source: 'frontend',
        context: {
          ...logEntry.context,
          ip: req.ip,
          forwardedFor: req.get('X-Forwarded-For'),
        },
        error: logEntry.error,
      };

      // Log using backend logger
      logger[logLevel as keyof typeof logger]('Frontend error reported', structuredLog);

      // For critical errors, you might want to send alerts
      if (logEntry.level === 'fatal' || logEntry.level === 'error') {
        // TODO: Implement alerting system (email, Slack, etc.)
        logger.error('Critical frontend error detected', {
          errorId: logEntry.context.errorId,
          message: logEntry.message,
          url: logEntry.context.url,
          userAgent: logEntry.context.userAgent,
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${logs.length} log entries`,
      processed: logs.length,
    });
  })
);

/**
 * GET /api/logs/stats
 * Get error statistics (for monitoring dashboard)
 */
router.get('/stats',
  generalRateLimit,
  asyncHandler(async (req, res) => {
    // This would typically query a database or log aggregation service
    // For now, return mock data
    const stats = {
      totalErrors: 0,
      errorsByLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      },
      topErrors: [],
      recentErrors: [],
      errorTrends: {
        last24h: 0,
        last7d: 0,
        last30d: 0,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;