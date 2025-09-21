// Offline detection and network status monitoring hook

import { useState, useEffect, useCallback } from 'react';
import { logInfo, logWarning } from '../utils/errorLogger';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean;
  offlineDuration: number;
  lastOnlineTime: Date | null;
  networkStatus: NetworkStatus | null;
}

const getNetworkStatus = (): NetworkStatus | null => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return {
      isOnline: navigator.onLine,
      isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g',
      connectionType: connection.type || 'unknown',
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false,
    };
  }
  return null;
};

export const useOfflineDetection = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>(() => {
    const isOnline = navigator.onLine;
    return {
      isOnline,
      wasOffline: false,
      offlineDuration: 0,
      lastOnlineTime: isOnline ? new Date() : null,
      networkStatus: getNetworkStatus(),
    };
  });

  const [offlineStartTime, setOfflineStartTime] = useState<Date | null>(null);

  const handleOnline = useCallback(() => {
    const now = new Date();
    const duration = offlineStartTime ? now.getTime() - offlineStartTime.getTime() : 0;

    setOfflineState(prev => ({
      ...prev,
      isOnline: true,
      wasOffline: prev.wasOffline || !prev.isOnline,
      offlineDuration: duration,
      lastOnlineTime: now,
      networkStatus: getNetworkStatus(),
    }));

    setOfflineStartTime(null);

    // Log reconnection
    logInfo('Network connection restored', {
      action: 'network_online',
      metadata: {
        offlineDuration: duration,
        networkStatus: getNetworkStatus(),
      },
    });
  }, [offlineStartTime]);

  const handleOffline = useCallback(() => {
    const now = new Date();
    setOfflineStartTime(now);

    setOfflineState(prev => ({
      ...prev,
      isOnline: false,
      networkStatus: null,
    }));

    // Log disconnection
    logWarning('Network connection lost', {
      action: 'network_offline',
      metadata: {
        lastOnlineTime: offlineState.lastOnlineTime?.toISOString(),
      },
    });
  }, [offlineState.lastOnlineTime]);

  const handleConnectionChange = useCallback(() => {
    const networkStatus = getNetworkStatus();
    setOfflineState(prev => ({
      ...prev,
      networkStatus,
    }));

    // Log connection changes
    if (networkStatus) {
      logInfo('Network connection changed', {
        action: 'network_change',
        metadata: { networkStatus },
      });
    }
  }, []);

  useEffect(() => {
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', handleConnectionChange);
    }

    // Periodic connectivity check
    const connectivityCheck = setInterval(async () => {
      if (navigator.onLine) {
        try {
          // Try to fetch a small resource to verify actual connectivity
          const response = await fetch('/health', {
            method: 'HEAD',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok && offlineState.isOnline) {
            // We think we're online but can't reach the server
            logWarning('Server unreachable despite online status', {
              action: 'connectivity_check_failed',
              metadata: {
                status: response.status,
                statusText: response.statusText,
              },
            });
          }
        } catch (error) {
          if (offlineState.isOnline) {
            logWarning('Connectivity check failed', {
              action: 'connectivity_check_error',
              metadata: {
                error: error instanceof Error ? error.message : String(error),
              },
            });
          }
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', handleConnectionChange);
      }

      clearInterval(connectivityCheck);
    };
  }, [handleOnline, handleOffline, handleConnectionChange, offlineState.isOnline]);

  const retry = useCallback(async (fn: () => Promise<any>, maxRetries = 3) => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retry, with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  const isSlowConnection = offlineState.networkStatus?.isSlowConnection || false;
  const shouldOptimizeForBandwidth = isSlowConnection || offlineState.networkStatus?.saveData || false;

  return {
    ...offlineState,
    isSlowConnection,
    shouldOptimizeForBandwidth,
    retry,
  };
};

export default useOfflineDetection;