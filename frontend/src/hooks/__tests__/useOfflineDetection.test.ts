// Tests for offline detection hook

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineDetection } from '../useOfflineDetection';

// Mock the error logger
vi.mock('../../utils/errorLogger', () => ({
  logInfo: vi.fn(),
  logWarning: vi.fn(),
}));

describe('useOfflineDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
    
    // Mock connection API
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '4g',
        type: 'wifi',
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
    });
    
    // Mock fetch for connectivity checks
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with online state', () => {
    const { result } = renderHook(() => useOfflineDetection());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
    expect(result.current.offlineDuration).toBe(0);
    expect(result.current.lastOnlineTime).toBeInstanceOf(Date);
  });

  it('should initialize with offline state when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });
    
    const { result } = renderHook(() => useOfflineDetection());
    
    expect(result.current.isOnline).toBe(false);
    expect(result.current.lastOnlineTime).toBe(null);
  });

  it('should detect network status from connection API', () => {
    const { result } = renderHook(() => useOfflineDetection());
    
    expect(result.current.networkStatus).toEqual({
      isOnline: true,
      isSlowConnection: false,
      connectionType: 'wifi',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    });
  });

  it('should detect slow connection', () => {
    Object.defineProperty(navigator, 'connection', {
      value: {
        effectiveType: '2g',
        type: 'cellular',
        downlink: 0.5,
        rtt: 300,
        saveData: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
    });
    
    const { result } = renderHook(() => useOfflineDetection());
    
    expect(result.current.isSlowConnection).toBe(true);
    expect(result.current.shouldOptimizeForBandwidth).toBe(true);
    expect(result.current.networkStatus?.isSlowConnection).toBe(true);
  });

  it('should handle offline event', async () => {
    const { result } = renderHook(() => useOfflineDetection());
    
    expect(result.current.isOnline).toBe(true);
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });
    
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOnline).toBe(false);
  });

  it('should handle online event and calculate offline duration', async () => {
    const { result } = renderHook(() => useOfflineDetection());
    
    // Start online
    expect(result.current.isOnline).toBe(true);
    
    // Go offline
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });
    
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOnline).toBe(false);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Come back online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
    });
    
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
    expect(result.current.offlineDuration).toBeGreaterThan(0);
  });

  it('should handle connection change events', () => {
    const mockConnection = {
      effectiveType: '4g',
      type: 'wifi',
      downlink: 10,
      rtt: 50,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    Object.defineProperty(navigator, 'connection', {
      value: mockConnection,
      writable: true,
    });
    
    const { result } = renderHook(() => useOfflineDetection());
    
    // Simulate connection change
    mockConnection.effectiveType = '3g';
    mockConnection.downlink = 2;
    
    act(() => {
      // Trigger the change event handler
      const changeHandler = mockConnection.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      
      if (changeHandler) {
        changeHandler();
      }
    });
    
    expect(result.current.networkStatus?.effectiveType).toBe('3g');
  });

  describe('retry function', () => {
    it('should retry failed operations', async () => {
      const { result } = renderHook(() => useOfflineDetection());
      
      let attempts = 0;
      const mockFn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });
      
      const resultPromise = result.current.retry(mockFn, 3);
      
      await expect(resultPromise).resolves.toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const { result } = renderHook(() => useOfflineDetection());
      
      const mockFn = vi.fn().mockRejectedValue(new Error('Persistent failure'));
      
      const resultPromise = result.current.retry(mockFn, 2);
      
      await expect(resultPromise).rejects.toThrow('Persistent failure');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const { result } = renderHook(() => useOfflineDetection());
      
      const startTime = Date.now();
      let attempts = 0;
      const mockFn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      });
      
      await result.current.retry(mockFn, 3);
      
      const duration = Date.now() - startTime;
      // Should have waited at least 1000ms + 2000ms = 3000ms for retries
      expect(duration).toBeGreaterThan(2500); // Allow some tolerance
    });
  });

  it('should perform periodic connectivity checks', async () => {
    vi.useFakeTimers();
    
    renderHook(() => useOfflineDetection());
    
    // Fast-forward 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    
    expect(fetch).toHaveBeenCalledWith('/health', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: expect.any(AbortSignal),
    });
    
    vi.useRealTimers();
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const mockConnection = {
      effectiveType: '4g',
      type: 'wifi',
      downlink: 10,
      rtt: 50,
      saveData: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    Object.defineProperty(navigator, 'connection', {
      value: mockConnection,
      writable: true,
    });
    
    const { unmount } = renderHook(() => useOfflineDetection());
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(mockConnection.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});