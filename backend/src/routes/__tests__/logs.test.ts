// Tests for error logging endpoints

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import logsRouter from '../logs';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock middleware
jest.mock('../../middleware/errorHandler', () => ({
  asyncHandler: (fn: any) => fn,
}));

jest.mock('../../middleware/validation', () => ({
  validateBody: () => (req: any, res: any, next: any) => next(),
}));

jest.mock('../../middleware/security', () => ({
  generalRateLimit: (req: any, res: any, next: any) => next(),
}));

describe('Logs Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/logs', logsRouter);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/logs/errors', () => {
    it('should accept valid error logs', async () => {
      const errorLogs = {
        logs: [
          {
            level: 'error',
            message: 'Test error',
            timestamp: new Date().toISOString(),
            fingerprint: 'test123',
            context: {
              errorId: 'error_123',
              userId: 'user_456',
              sessionId: 'session_789',
              url: 'https://example.com',
              userAgent: 'Test Agent',
              errorBoundary: true,
            },
            error: {
              name: 'Error',
              message: 'Test error',
              stack: 'Error: Test error\n    at test',
            },
          },
        ],
      };

      const response = await request(app)
        .post('/api/logs/errors')
        .send(errorLogs)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Processed 1 log entries',
        processed: 1,
      });
    });

    it('should handle multiple log entries', async () => {
      const errorLogs = {
        logs: [
          {
            level: 'error',
            message: 'Error 1',
            timestamp: new Date().toISOString(),
            fingerprint: 'test123',
            context: {
              errorId: 'error_1',
            },
          },
          {
            level: 'warn',
            message: 'Warning 1',
            timestamp: new Date().toISOString(),
            fingerprint: 'test456',
            context: {
              errorId: 'warn_1',
            },
          },
        ],
      };

      const response = await request(app)
        .post('/api/logs/errors')
        .send(errorLogs)
        .expect(200);

      expect(response.body.processed).toBe(2);
    });

    it('should handle fatal errors', async () => {
      const { logger } = require('../../utils/logger');
      
      const errorLogs = {
        logs: [
          {
            level: 'fatal',
            message: 'Fatal error',
            timestamp: new Date().toISOString(),
            fingerprint: 'fatal123',
            context: {
              errorId: 'fatal_error',
            },
          },
        ],
      };

      await request(app)
        .post('/api/logs/errors')
        .send(errorLogs)
        .expect(200);

      // Fatal errors should be logged as error level
      expect(logger.error).toHaveBeenCalledWith(
        'Frontend error reported',
        expect.objectContaining({
          level: 'error',
          message: 'Fatal error',
        })
      );

      // Should also trigger critical error logging
      expect(logger.error).toHaveBeenCalledWith(
        'Critical frontend error detected',
        expect.objectContaining({
          errorId: 'fatal_error',
          message: 'Fatal error',
        })
      );
    });
  });

  describe('GET /api/logs/stats', () => {
    it('should return error statistics', async () => {
      const response = await request(app)
        .get('/api/logs/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          totalErrors: expect.any(Number),
          errorsByLevel: expect.objectContaining({
            debug: expect.any(Number),
            info: expect.any(Number),
            warn: expect.any(Number),
            error: expect.any(Number),
            fatal: expect.any(Number),
          }),
          topErrors: expect.any(Array),
          recentErrors: expect.any(Array),
          errorTrends: expect.objectContaining({
            last24h: expect.any(Number),
            last7d: expect.any(Number),
            last30d: expect.any(Number),
          }),
        }),
      });
    });
  });
});