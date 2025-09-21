// Error recovery and graceful degradation utilities

import { APIError } from '../types/api';
import { logError, logInfo, ErrorLogLevel } from './errorLogger';

export interface RecoveryStrategy {
  canRecover: boolean;
  strategy: 'retry' | 'fallback' | 'cache' | 'degraded' | 'none';
  maxAttempts: number;
  delay: number;
  fallbackData?: any;
  userMessage: string;
}

export interface RecoveryContext {
  operation: string;
  attempt: number;
  lastError?: Error;
  metadata?: Record<string, unknown>;
}

class ErrorRecoveryManager {
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private activeRecoveries: Map<string, RecoveryContext> = new Map();

  constructor() {
    this.setupDefaultStrategies();
  }

  private setupDefaultStrategies() {
    // Network-related errors
    this.recoveryStrategies.set('NETWORK_ERROR', {
      canRecover: true,
      strategy: 'retry',
      maxAttempts: 3,
      delay: 1000,
      userMessage: 'Connection issue detected. Retrying...',
    });

    this.recoveryStrategies.set('TIMEOUT', {
      canRecover: true,
      strategy: 'retry',
      maxAttempts: 2,
      delay: 2000,
      userMessage: 'Request timed out. Trying again...',
    });

    // Rate limiting
    this.recoveryStrategies.set('RATE_LIMIT_EXCEEDED', {
      canRecover: true,
      strategy: 'retry',
      maxAttempts: 3,
      delay: 5000,
      userMessage: 'Too many requests. Waiting before retry...',
    });

    // Service errors
    this.recoveryStrategies.set('EXTERNAL_SERVICE_ERROR', {
      canRecover: true,
      strategy: 'fallback',
      maxAttempts: 1,
      delay: 0,
      userMessage: 'Service unavailable. Using alternative approach...',
    });

    this.recoveryStrategies.set('INVALID_API_KEY', {
      canRecover: true,
      strategy: 'fallback',
      maxAttempts: 1,
      delay: 0,
      userMessage: 'Service temporarily unavailable. Trying alternative...',
    });

    // Client errors (usually not recoverable)
    this.recoveryStrategies.set('VALIDATION_ERROR', {
      canRecover: false,
      strategy: 'none',
      maxAttempts: 0,
      delay: 0,
      userMessage: 'Please check your input and try again.',
    });

    this.recoveryStrategies.set('NOT_FOUND', {
      canRecover: false,
      strategy: 'none',
      maxAttempts: 0,
      delay: 0,
      userMessage: 'The requested resource was not found.',
    });

    // Server errors
    this.recoveryStrategies.set('INTERNAL_SERVER_ERROR', {
      canRecover: true,
      strategy: 'retry',
      maxAttempts: 2,
      delay: 3000,
      userMessage: 'Server error. Retrying...',
    });
  }

  public getRecoveryStrategy(errorCode: string): RecoveryStrategy {
    return this.recoveryStrategies.get(errorCode) || {
      canRecover: false,
      strategy: 'none',
      maxAttempts: 0,
      delay: 0,
      userMessage: 'An unexpected error occurred.',
    };
  }

  public async executeWithRecovery<T>(
    operation: string,
    fn: () => Promise<T>,
    errorCode?: string,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const recoveryKey = `${operation}_${Date.now()}`;
    let context: RecoveryContext = {
      operation,
      attempt: 0,
      metadata,
    };

    this.activeRecoveries.set(recoveryKey, context);

    try {
      while (context.attempt < 10) { // Safety limit
        context.attempt++;
        
        try {
          const result = await fn();
          
          // Success - clean up and return
          this.activeRecoveries.delete(recoveryKey);
          
          if (context.attempt > 1) {
            logInfo(`Operation recovered after ${context.attempt} attempts`, {
              action: 'operation_recovered',
              metadata: { operation, attempts: context.attempt, ...metadata },
            });
          }
          
          return result;
        } catch (error) {
          context.lastError = error as Error;
          const apiError = error as APIError;
          const strategy = this.getRecoveryStrategy(errorCode || apiError.code || 'UNKNOWN_ERROR');
          
          // Log the error
          logError(context.lastError, ErrorLogLevel.WARN, {
            action: 'operation_failed',
            metadata: {
              operation,
              attempt: context.attempt,
              errorCode: apiError.code,
              canRecover: strategy.canRecover,
              ...metadata,
            },
          });

          // Check if we can and should recover
          if (!strategy.canRecover || context.attempt >= strategy.maxAttempts) {
            throw error;
          }

          // Apply recovery strategy
          await this.applyRecoveryStrategy(strategy, context);
        }
      }

      throw new Error('Maximum recovery attempts exceeded');
    } finally {
      this.activeRecoveries.delete(recoveryKey);
    }
  }

  private async applyRecoveryStrategy(strategy: RecoveryStrategy, context: RecoveryContext) {
    switch (strategy.strategy) {
      case 'retry':
        // Exponential backoff for retries
        const delay = strategy.delay * Math.pow(2, context.attempt - 1);
        await this.sleep(Math.min(delay, 30000)); // Cap at 30 seconds
        break;

      case 'fallback':
        // Log fallback attempt
        logInfo('Attempting fallback strategy', {
          action: 'fallback_attempt',
          metadata: { operation: context.operation, attempt: context.attempt },
        });
        break;

      case 'cache':
        // Try to use cached data (implementation depends on specific use case)
        logInfo('Attempting cache fallback', {
          action: 'cache_fallback',
          metadata: { operation: context.operation },
        });
        break;

      case 'degraded':
        // Provide degraded functionality
        logInfo('Switching to degraded mode', {
          action: 'degraded_mode',
          metadata: { operation: context.operation },
        });
        break;

      default:
        // No recovery possible
        break;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getActiveRecoveries(): RecoveryContext[] {
    return Array.from(this.activeRecoveries.values());
  }

  public cancelRecovery(operation: string) {
    for (const [key, context] of this.activeRecoveries.entries()) {
      if (context.operation === operation) {
        this.activeRecoveries.delete(key);
        logInfo('Recovery cancelled', {
          action: 'recovery_cancelled',
          metadata: { operation },
        });
      }
    }
  }
}

// Singleton instance
const errorRecoveryManager = new ErrorRecoveryManager();

// Convenience functions
export const executeWithRecovery = <T>(
  operation: string,
  fn: () => Promise<T>,
  errorCode?: string,
  metadata?: Record<string, unknown>
): Promise<T> => {
  return errorRecoveryManager.executeWithRecovery(operation, fn, errorCode, metadata);
};

export const getRecoveryStrategy = (errorCode: string): RecoveryStrategy => {
  return errorRecoveryManager.getRecoveryStrategy(errorCode);
};

export const getActiveRecoveries = (): RecoveryContext[] => {
  return errorRecoveryManager.getActiveRecoveries();
};

export const cancelRecovery = (operation: string) => {
  errorRecoveryManager.cancelRecovery(operation);
};

// Graceful degradation helpers
export const withGracefulDegradation = <T>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<T> | T,
  operation: string
): Promise<T> => {
  return executeWithRecovery(
    operation,
    async () => {
      try {
        return await primaryFn();
      } catch (error) {
        logInfo('Primary operation failed, using fallback', {
          action: 'graceful_degradation',
          metadata: { operation, error: (error as Error).message },
        });
        return await Promise.resolve(fallbackFn());
      }
    }
  );
};

export default errorRecoveryManager;