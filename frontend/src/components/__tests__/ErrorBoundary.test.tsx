// Tests for ErrorBoundary component

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock the error logger
vi.mock('../../utils/errorLogger', () => ({
  logError: vi.fn(),
  ErrorLogLevel: {
    ERROR: 'error',
    INFO: 'info',
  },
}));

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = false, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  const originalEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Component crashed" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  it('should show network-specific error message for network errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network error occurred" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText(/trouble connecting to our servers/)).toBeInTheDocument();
  });

  it('should display error ID', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Error ID:/)).toBeInTheDocument();
  });

  it('should allow retry when under max attempts', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText(/Try Again/);
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).not.toBeDisabled();
  });

  it('should handle retry button click', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText(/Try Again/);
    fireEvent.click(retryButton);

    // After retry, should render the component again (without error this time)
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should handle refresh page button click', () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('Refresh Page');
    fireEvent.click(refreshButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('should disable retry after max attempts', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      
      return (
        <ErrorBoundary>
          <button onClick={() => setShouldThrow(!shouldThrow)}>
            Toggle Error
          </button>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };

    render(<TestComponent />);

    // Trigger error multiple times to exceed max retries
    for (let i = 0; i < 4; i++) {
      const retryButton = screen.queryByText(/Try Again/);
      if (retryButton && !retryButton.textContent?.includes('attempts left')) {
        fireEvent.click(retryButton);
      }
    }

    expect(screen.getByText(/Maximum retry attempts reached/)).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Development error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
  });

  it('should not show error details in production mode', () => {
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();
  });

  it('should call onError callback when provided', () => {
    const onErrorMock = vi.fn();

    render(
      <ErrorBoundary onError={onErrorMock}>
        <ThrowError shouldThrow={true} errorMessage="Callback test error" />
      </ErrorBoundary>
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Callback test error',
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error: Error, errorInfo: any, resetError: () => void) => (
      <div>
        <h1>Custom Error UI</h1>
        <p>Error: {error.message}</p>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} errorMessage="Custom fallback test" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Error: Custom fallback test')).toBeInTheDocument();
    expect(screen.getByText('Custom Reset')).toBeInTheDocument();
  });

  it('should log errors with proper context', () => {
    const { logError } = require('../../utils/errorLogger');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Logging test error" />
      </ErrorBoundary>
    );

    expect(logError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Logging test error',
      }),
      'error',
      expect.objectContaining({
        errorBoundary: true,
        componentStack: expect.any(String),
        retryCount: 0,
        userAgent: expect.any(String),
        url: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });

  it('should handle multiple consecutive errors', () => {
    const TestComponent = () => {
      const [errorCount, setErrorCount] = React.useState(0);
      
      if (errorCount > 0) {
        throw new Error(`Error ${errorCount}`);
      }
      
      return (
        <button onClick={() => setErrorCount(errorCount + 1)}>
          Trigger Error
        </button>
      );
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    const triggerButton = screen.getByText('Trigger Error');
    fireEvent.click(triggerButton);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    const retryButton = screen.getByText(/Try Again/);
    fireEvent.click(retryButton);

    // Should show retry count
    expect(screen.getByText(/2 attempts left/)).toBeInTheDocument();
  });
});