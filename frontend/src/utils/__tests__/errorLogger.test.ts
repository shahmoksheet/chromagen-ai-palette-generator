/**
 * @vitest-environment jsdom
 */

// Tests for error logging utility

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logError, logInfo, logWarning, getErrorLogs, clearErrorLogs, ErrorLogLevel } from '../errorLogger';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock fetch
const fetchMock = vi.fn();

// Mock console methods
const consoleMock = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe('ErrorLogger', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock global objects
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    global.fetch = fetchMock;
    
    Object.defineProperty(console, 'log', { value: consoleMock.log });
    Object.defineProperty(console, 'warn', { value: consoleMock.warn });
    Object.defineProperty(console, 'error', { value: consoleMock.error });
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
    
    // Clear logs before each test
    clearErrorLogs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logError', () => {
    it('should log an error with default level', () => {
      const error = new Error('Test error');
      logError(error);
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(ErrorLogLevel.ERROR);
      expect(logs[0].message).toBe('Test error');
      expect(logs[0].error).toBe(error);
    });

    it('should log an error with custom level and context', () => {
      const error = new Error('Test warning');
      const context = { userId: 'user123', action: 'test_action' };
      
      logError(error, ErrorLogLevel.WARN, context);
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(ErrorLogLevel.WARN);
      expect(logs[0].context.userId).toBe('user123');
      expect(logs[0].context.action).toBe('test_action');
    });

    it('should generate unique fingerprints for different errors', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      
      logError(error1);
      logError(error2);
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].fingerprint).not.toBe(logs[1].fingerprint);
    });

    it('should generate same fingerprint for identical errors', () => {
      const error1 = new Error('Same error');
      const error2 = new Error('Same error');
      
      logError(error1);
      logError(error2);
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].fingerprint).toBe(logs[1].fingerprint);
    });

    it('should persist logs to localStorage', () => {
      const error = new Error('Test error');
      logError(error);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chromagen_error_logs',
        expect.any(String)
      );
    });

    it('should console.error in development mode', () => {
      // Mock NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      logError(error);
      
      expect(consoleMock.error).toHaveBeenCalled();
      
      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logInfo', () => {
    it('should log info message', () => {
      logInfo('Test info message');
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(ErrorLogLevel.INFO);
      expect(logs[0].message).toBe('Test info message');
    });
  });

  describe('logWarning', () => {
    it('should log warning message', () => {
      logWarning('Test warning message');
      
      const logs = getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(ErrorLogLevel.WARN);
      expect(logs[0].message).toBe('Test warning message');
    });
  });

  describe('log management', () => {
    it('should maintain maximum log count', () => {
      // Log more than the maximum (100)
      for (let i = 0; i < 150; i++) {
        logError(new Error(`Error ${i}`));
      }
      
      const logs = getErrorLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
      
      // Should keep the most recent logs
      expect(logs[logs.length - 1].message).toBe('Error 149');
    });

    it('should clear logs', () => {
      logError(new Error('Test error'));
      expect(getErrorLogs()).toHaveLength(1);
      
      clearErrorLogs();
      expect(getErrorLogs()).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('chromagen_error_logs');
    });
  });

  describe('global error handlers', () => {
    it('should handle unhandled errors', () => {
      const error = new Error('Unhandled error');
      const errorEvent = new ErrorEvent('error', {
        error,
        message: 'Unhandled error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
      });
      
      window.dispatchEvent(errorEvent);
      
      const logs = getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      const errorLog = logs.find(log => log.message === 'Unhandled error');
      expect(errorLog).toBeDefined();
      expect(errorLog?.context.errorBoundary).toBe(false);
    });

    it('should handle unhandled promise rejections', () => {
      const error = new Error('Promise rejection');
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(error),
        reason: error,
      });
      
      window.dispatchEvent(rejectionEvent);
      
      const logs = getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      const errorLog = logs.find(log => log.message === 'Promise rejection');
      expect(errorLog).toBeDefined();
      expect(errorLog?.context.type).toBe('unhandled_promise_rejection');
    });
  });

  describe('offline handling', () => {
    it('should not flush logs when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });
      
      logError(new Error('Offline error'), ErrorLogLevel.FATAL);
      
      // Wait a bit to ensure no fetch is called
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should flush logs when coming back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });
      
      logError(new Error('Offline error'));
      
      // Mock successful fetch
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      // Come back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });
      
      // Trigger online event
      window.dispatchEvent(new Event('online'));
      
      // Wait for flush
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(fetchMock).toHaveBeenCalledWith('/api/logs/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
      });
    });
  });
});