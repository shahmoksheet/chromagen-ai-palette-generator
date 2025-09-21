import React, { useState, useEffect } from 'react';
import { colorAPI } from '../utils/api';

const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsChecking(true);
        await colorAPI.testConnection();
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-center text-sm z-50">
      <div className="flex items-center justify-center gap-2">
        {isChecking ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Checking connection...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Connection lost. Please check if the backend is running on port 3333.
            <button
              onClick={() => window.location.reload()}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;