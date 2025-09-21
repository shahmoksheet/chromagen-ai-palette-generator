import React from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { APIError } from '../types/api';
import ErrorBoundary from './ErrorBoundary';
import { useOfflineDetection } from '../hooks/useOfflineDetection';
import { logError, ErrorLogLevel } from '../utils/errorLogger';

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
}

interface ApiErrorDisplayProps {
  error: APIError;
  resetError: () => void;
}

const ApiErrorDisplay: React.FC<ApiErrorDisplayProps> = ({ error, resetError }) => {
  const { isOnline, retry } = useOfflineDetection();

  const handleRetryWithBackoff = async () => {
    try {
      await retry(async () => {
        resetError();
        return Promise.resolve();
      });
    } catch (retryError) {
      logError(retryError as Error, ErrorLogLevel.ERROR, {
        action: 'api_retry_failed',
        metadata: { originalError: error },
      });
    }
  };
  const getErrorTitle = (error: APIError): string => {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Connection Problem';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too Many Requests';
      case 'INVALID_API_KEY':
        return 'Service Unavailable';
      case 'TIMEOUT':
        return 'Request Timeout';
      case 'NOT_FOUND':
        return 'Not Found';
      case 'UNAUTHORIZED':
        return 'Unauthorized';
      case 'FORBIDDEN':
        return 'Access Denied';
      case 'VALIDATION_ERROR':
        return 'Invalid Input';
      case 'INTERNAL_SERVER_ERROR':
        return 'Server Error';
      default:
        return 'Something went wrong';
    }
  };

  const getErrorIcon = (error: APIError): React.ReactNode => {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return (
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case 'RATE_LIMIT_EXCEEDED':
        return (
          <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'UNAUTHORIZED':
      case 'FORBIDDEN':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getErrorActions = (error: APIError): React.ReactNode => {
    const isNetworkRelated = error.code === 'NETWORK_ERROR' || !isOnline;
    
    switch (error.code) {
      case 'NETWORK_ERROR':
        return (
          <div className="space-y-3">
            {!isOnline && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md mb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-orange-800">You're currently offline</span>
                </div>
              </div>
            )}
            <button 
              onClick={handleRetryWithBackoff} 
              className="w-full btn-primary"
              disabled={!isOnline}
            >
              {isOnline ? 'Check Connection & Retry' : 'Waiting for connection...'}
            </button>
            <p className="text-sm text-gray-500">
              {isOnline 
                ? 'Please check your internet connection and try again.'
                : 'We\'ll automatically retry when your connection is restored.'
              }
            </p>
          </div>
        );
      case 'RATE_LIMIT_EXCEEDED':
        return (
          <div className="space-y-3">
            <button onClick={handleRetryWithBackoff} className="w-full btn-primary">
              Try Again
            </button>
            <p className="text-sm text-gray-500">
              You've made too many requests. Please wait a moment before trying again.
            </p>
          </div>
        );
      case 'TIMEOUT':
        return (
          <div className="space-y-3">
            <button onClick={handleRetryWithBackoff} className="w-full btn-primary">
              Retry Request
            </button>
            <p className="text-sm text-gray-500">
              The request took too long to complete. Please try again.
            </p>
          </div>
        );
      case 'INVALID_API_KEY':
      case 'EXTERNAL_SERVICE_ERROR':
        return (
          <div className="space-y-3">
            <button onClick={resetError} className="w-full btn-primary">
              Try Again
            </button>
            <p className="text-sm text-gray-500">
              Our service is temporarily unavailable. Please try again in a few minutes.
            </p>
          </div>
        );
      default:
        return (
          <div className="space-y-3">
            <button onClick={handleRetryWithBackoff} className="w-full btn-primary">
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full btn-secondary"
            >
              Refresh Page
            </button>
            {isNetworkRelated && (
              <p className="text-sm text-gray-500">
                This might be a temporary network issue. Please check your connection.
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          {getErrorIcon(error)}
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {getErrorTitle(error)}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {error.error}
        </p>
        
        {getErrorActions(error)}
        
        {process.env.NODE_ENV === 'development' && error.details && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

const ApiErrorBoundary: React.FC<ApiErrorBoundaryProps> = ({ children }) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log API-related errors with additional context
            logError(error, ErrorLogLevel.ERROR, {
              errorBoundary: true,
              componentStack: errorInfo.componentStack || undefined,
              action: 'api_error_boundary',
              metadata: {
                errorType: 'api_boundary',
              },
            });
          }}
          fallback={(error, errorInfo, resetError) => {
            // Check if this looks like an API error
            const isAPIError = error.message.includes('API') || 
                              error.message.includes('fetch') ||
                              error.message.includes('Network');
            
            if (isAPIError) {
              const apiError: APIError = {
                error: error.message,
                code: 'UNKNOWN_API_ERROR',
                details: { originalError: error.message },
              };
              
              return <ApiErrorDisplay error={apiError} resetError={resetError} />;
            }
            
            // Fall back to default error boundary display
            return null;
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

export default ApiErrorBoundary;