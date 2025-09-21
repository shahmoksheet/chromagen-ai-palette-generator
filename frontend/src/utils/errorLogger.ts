// Comprehensive error logging and monitoring utility

export enum ErrorLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface ErrorContext {
  errorId?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  componentStack?: string;
  errorBoundary?: boolean;
  retryCount?: number;
  action?: string;
  line?: number;
  column?: number;
  type?: string;
  resourceType?: string;
  resourceSrc?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorLogEntry {
  level: ErrorLogLevel;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context: ErrorContext;
  timestamp: string;
  fingerprint: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    // Only set up browser-specific features if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Monitor online status
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushLogs();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Global error handlers
      this.setupGlobalErrorHandlers();

      // Periodic log flushing
      setInterval(() => {
        if (this.isOnline && this.logs.length > 0) {
          this.flushLogs();
        }
      }, 30000); // Flush every 30 seconds
    }
  }

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;
    
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), ErrorLogLevel.ERROR, {
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        errorBoundary: false,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        ErrorLogLevel.ERROR,
        {
          type: 'unhandled_promise_rejection',
          errorBoundary: false,
        }
      );
    });

    // Catch resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement;
        this.logError(new Error(`Resource loading failed: ${target.tagName}`), ErrorLogLevel.WARN, {
          resourceType: target.tagName,
          resourceSrc: (target as any).src || (target as any).href,
          errorBoundary: false,
        });
      }
    }, true);
  }

  public logError(error: Error, level: ErrorLogLevel = ErrorLogLevel.ERROR, context: ErrorContext = {}) {
    const timestamp = new Date().toISOString();
    const fingerprint = this.generateFingerprint(error, context);

    const logEntry: ErrorLogEntry = {
      level,
      message: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        ...context,
        timestamp,
        url: context.url || (typeof window !== 'undefined' ? window.location.href : 'unknown'),
        userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'),
        sessionId: context.sessionId || this.getSessionId(),
      },
      timestamp,
      fingerprint,
    };

    // Add to local storage
    this.logs.push(logEntry);

    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Store in localStorage for persistence
    this.persistLogs();

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === ErrorLogLevel.ERROR || level === ErrorLogLevel.FATAL ? 'error' :
                           level === ErrorLogLevel.WARN ? 'warn' : 'log';
      console[consoleMethod]('Error logged:', logEntry);
    }

    // Immediate flush for critical errors
    if (level === ErrorLogLevel.FATAL || level === ErrorLogLevel.ERROR) {
      this.flushLogs();
    }
  }

  public logInfo(message: string, context: ErrorContext = {}) {
    this.logError(new Error(message), ErrorLogLevel.INFO, context);
  }

  public logWarning(message: string, context: ErrorContext = {}) {
    this.logError(new Error(message), ErrorLogLevel.WARN, context);
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    const key = `${error.name}_${error.message}_${context.componentStack || ''}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private getSessionId(): string {
    if (typeof localStorage === 'undefined') return 'anonymous';
    return localStorage.getItem('chromagen_session_id') || 'anonymous';
  }

  private persistLogs() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const logsToStore = this.logs.slice(-50); // Store last 50 logs
      localStorage.setItem('chromagen_error_logs', JSON.stringify(logsToStore));
    } catch (error) {
      console.warn('Failed to persist error logs:', error);
    }
  }

  private async flushLogs() {
    if (this.logs.length === 0 || !this.isOnline) {
      return;
    }

    const logsToFlush = [...this.logs];
    this.logs = [];

    try {
      // Send logs to backend (if endpoint exists)
      const response = await fetch('/api/logs/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToFlush }),
      });

      if (response.ok) {
        // Clear persisted logs on successful flush
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('chromagen_error_logs');
        }
      } else {
        // Re-add logs if flush failed
        this.logs.unshift(...logsToFlush);
      }
    } catch (error) {
      // Re-add logs if flush failed
      this.logs.unshift(...logsToFlush);
      console.warn('Failed to flush error logs:', error);
    }
  }

  public getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('chromagen_error_logs');
    }
  }

  public getErrorStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<ErrorLogLevel, number>,
      byFingerprint: {} as Record<string, number>,
      recent: this.logs.filter(log => 
        Date.now() - new Date(log.timestamp).getTime() < 3600000 // Last hour
      ).length,
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byFingerprint[log.fingerprint] = (stats.byFingerprint[log.fingerprint] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
const errorLogger = new ErrorLogger();

// Export convenience functions
export const logError = (error: Error, level?: ErrorLogLevel, context?: ErrorContext) => {
  errorLogger.logError(error, level, context);
};

export const logInfo = (message: string, context?: ErrorContext) => {
  errorLogger.logInfo(message, context);
};

export const logWarning = (message: string, context?: ErrorContext) => {
  errorLogger.logWarning(message, context);
};

export const getErrorLogs = () => errorLogger.getLogs();
export const clearErrorLogs = () => errorLogger.clearLogs();
export const getErrorStats = () => errorLogger.getErrorStats();

export default errorLogger;