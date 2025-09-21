// Offline status indicator component

import React, { useState, useEffect } from 'react';
import { useOfflineDetection } from '../hooks/useOfflineDetection';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { 
    isOnline, 
    wasOffline, 
    offlineDuration, 
    isSlowConnection,
    networkStatus 
  } = useOfflineDetection();
  
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (isOnline && !showReconnected && !isSlowConnection) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      {!isOnline && (
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-sm font-medium">
            You're offline
          </span>
          {showDetails && offlineDuration > 0 && (
            <span className="text-xs opacity-75">
              ({formatDuration(offlineDuration)})
            </span>
          )}
        </div>
      )}

      {showReconnected && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-sm font-medium">
            Back online!
          </span>
          {showDetails && offlineDuration > 0 && (
            <span className="text-xs opacity-75">
              (offline for {formatDuration(offlineDuration)})
            </span>
          )}
        </div>
      )}

      {isOnline && isSlowConnection && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            Slow connection
          </span>
          {showDetails && networkStatus && (
            <span className="text-xs opacity-75">
              ({networkStatus.effectiveType})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;