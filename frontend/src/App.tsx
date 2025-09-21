import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import ApiErrorBoundary from './components/ApiErrorBoundary'
import ConnectionStatus from './components/ConnectionStatus'
import LoadingSpinner from './components/LoadingSpinner'
import PerformanceDashboard from './components/PerformanceDashboard'
import OfflineIndicator from './components/OfflineIndicator'
import { APIError } from './types/api'
import { logError, ErrorLogLevel } from './utils/errorLogger'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const apiError = error as unknown as APIError;
        
        // Log query failures for monitoring
        logError(new Error(apiError?.error || 'Query failed'), ErrorLogLevel.WARN, {
          action: 'query_retry',
          metadata: {
            failureCount,
            errorCode: apiError?.code,
            maxRetries: 3,
          },
        });
        
        // Don't retry on certain error types
        if (apiError?.code === 'UNAUTHORIZED' || 
            apiError?.code === 'FORBIDDEN' || 
            apiError?.code === 'NOT_FOUND' ||
            apiError?.code === 'VALIDATION_ERROR') {
          return false;
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,

    },
    mutations: {
      retry: (failureCount, error) => {
        const apiError = error as unknown as APIError;
        
        // Log mutation failures
        logError(new Error(apiError?.error || 'Mutation failed'), ErrorLogLevel.WARN, {
          action: 'mutation_retry',
          metadata: {
            failureCount,
            errorCode: apiError?.code,
          },
        });
        
        // Only retry on network errors and server errors
        if (apiError?.code === 'NETWORK_ERROR' || 
            apiError?.code === 'TIMEOUT' ||
            apiError?.code === 'INTERNAL_SERVER_ERROR') {
          return failureCount < 2;
        }
        
        return false;
      },

    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ApiErrorBoundary>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <ConnectionStatus />
              <OfflineIndicator showDetails={true} />
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                </Routes>
              </Suspense>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#10b981',
                      color: '#fff',
                    },
                  },
                  error: {
                    style: {
                      background: '#ef4444',
                      color: '#fff',
                    },
                  },
                }}
              />
              
              {/* Performance Dashboard - only in development */}
              {import.meta.env.DEV && <PerformanceDashboard />}
            </div>
          </Router>
        </ApiErrorBoundary>

      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App