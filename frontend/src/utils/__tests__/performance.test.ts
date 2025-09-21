import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  performanceMonitor, 
  measureAsync, 
  measureSync, 
  analyzeBundleSize,
  monitorMemoryUsage,
  monitorNetworkPerformance 
} from '../performance';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => 1000),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

const mockNavigator = {
  connection: {
    downlink: 10,
    rtt: 50,
    effectiveType: '4g',
    saveData: false,
  },
};

// Mock PerformanceObserver
class MockPerformanceObserver {
  callback: (list: any) => void;
  
  constructor(callback: (list: any) => void) {
    this.callback = callback;
  }
  
  observe() {}
  disconnect() {}
}

describe('Performance Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.performance = mockPerformance as any;
    global.navigator = mockNavigator as any;
    global.PerformanceObserver = MockPerformanceObserver as any;
    
    // Mock window object
    Object.defineProperty(global, 'window', {
      value: {
        performance: mockPerformance,
        navigator: mockNavigator,
        PerformanceObserver: MockPerformanceObserver,
      },
      writable: true,
    });
    
    // Clear metrics
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('performanceMonitor', () => {
    it('should record metrics correctly', () => {
      performanceMonitor.recordMetric('test_metric', 100, { test: true });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test_metric');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].metadata).toEqual({ test: true });
    });

    it('should filter metrics by name', () => {
      performanceMonitor.recordMetric('metric_a', 100);
      performanceMonitor.recordMetric('metric_b', 200);
      performanceMonitor.recordMetric('metric_a', 150);
      
      const metricsA = performanceMonitor.getMetricsByName('metric_a');
      expect(metricsA).toHaveLength(2);
      expect(metricsA.every(m => m.name === 'metric_a')).toBe(true);
    });

    it('should calculate average metrics', () => {
      performanceMonitor.recordMetric('test_avg', 100);
      performanceMonitor.recordMetric('test_avg', 200);
      performanceMonitor.recordMetric('test_avg', 300);
      
      const average = performanceMonitor.getAverageMetric('test_avg');
      expect(average).toBe(200);
    });

    it('should return 0 for average of non-existent metric', () => {
      const average = performanceMonitor.getAverageMetric('non_existent');
      expect(average).toBe(0);
    });

    it('should clear metrics', () => {
      performanceMonitor.recordMetric('test', 100);
      expect(performanceMonitor.getMetrics()).toHaveLength(1);
      
      performanceMonitor.clearMetrics();
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });
  });

  describe('measureAsync', () => {
    it('should measure async function execution time', async () => {
      const mockFn = vi.fn().mockResolvedValue('result');
      mockPerformance.now
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1100); // end time
      
      const result = await measureAsync('async_test', mockFn, { test: true });
      
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledOnce();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('async_test');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].metadata).toEqual({ test: true });
    });

    it('should measure async function error time', async () => {
      const error = new Error('Test error');
      const mockFn = vi.fn().mockRejectedValue(error);
      mockPerformance.now
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1150); // end time
      
      await expect(measureAsync('async_error_test', mockFn)).rejects.toThrow('Test error');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('async_error_test_error');
      expect(metrics[0].value).toBe(150);
      expect(metrics[0].metadata?.error).toBe('Test error');
    });
  });

  describe('measureSync', () => {
    it('should measure sync function execution time', () => {
      const mockFn = vi.fn().mockReturnValue('result');
      mockPerformance.now
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1050); // end time
      
      const result = measureSync('sync_test', mockFn, { test: true });
      
      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledOnce();
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('sync_test');
      expect(metrics[0].value).toBe(50);
      expect(metrics[0].metadata).toEqual({ test: true });
    });

    it('should measure sync function error time', () => {
      const error = new Error('Sync error');
      const mockFn = vi.fn().mockImplementation(() => { throw error; });
      mockPerformance.now
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1075); // end time
      
      expect(() => measureSync('sync_error_test', mockFn)).toThrow('Sync error');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('sync_error_test_error');
      expect(metrics[0].value).toBe(75);
      expect(metrics[0].metadata?.error).toBe('Sync error');
    });
  });

  describe('analyzeBundleSize', () => {
    it('should analyze bundle size when performance API is available', () => {
      const mockResources = [
        { name: 'app.js', transferSize: 100000 },
        { name: 'vendor.js', transferSize: 200000 },
        { name: 'styles.css', transferSize: 50000 },
        { name: 'node_modules/lib.js', transferSize: 150000 }, // Should be excluded
      ];
      
      mockPerformance.getEntriesByType.mockReturnValue(mockResources);
      
      const result = analyzeBundleSize();
      
      expect(result).toEqual({
        jsSize: 300000, // app.js + vendor.js (node_modules excluded)
        cssSize: 50000,
        jsResources: 2,
        cssResources: 1,
      });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.some(m => m.name === 'bundle_js_size' && m.value === 300000)).toBe(true);
      expect(metrics.some(m => m.name === 'bundle_css_size' && m.value === 50000)).toBe(true);
    });

    it('should return null when performance API is not available', () => {
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });
      Object.defineProperty(global, 'performance', {
        value: undefined,
        writable: true,
      });
      
      const result = analyzeBundleSize();
      expect(result).toBeNull();
    });
  });

  describe('monitorMemoryUsage', () => {
    it('should monitor memory usage when available', () => {
      const result = monitorMemoryUsage();
      
      expect(result).toEqual({
        used: 1000000,
        total: 2000000,
        limit: 4000000,
        usage: 25, // (1000000 / 4000000) * 100
      });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.some(m => m.name === 'memory_used' && m.value === 1000000)).toBe(true);
      expect(metrics.some(m => m.name === 'memory_total' && m.value === 2000000)).toBe(true);
      expect(metrics.some(m => m.name === 'memory_limit' && m.value === 4000000)).toBe(true);
    });

    it('should return null when memory API is not available', () => {
      const mockPerformanceNoMemory = { ...mockPerformance };
      delete (mockPerformanceNoMemory as any).memory;
      global.performance = mockPerformanceNoMemory as any;
      
      const result = monitorMemoryUsage();
      expect(result).toBeNull();
    });
  });

  describe('monitorNetworkPerformance', () => {
    it('should monitor network performance when available', () => {
      const result = monitorNetworkPerformance();
      
      expect(result).toEqual({
        downlink: 10,
        rtt: 50,
        effectiveType: '4g',
        saveData: false,
      });
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.some(m => m.name === 'network_downlink' && m.value === 10)).toBe(true);
      expect(metrics.some(m => m.name === 'network_rtt' && m.value === 50)).toBe(true);
    });

    it('should return null when connection API is not available', () => {
      const mockNavigatorNoConnection = { ...mockNavigator };
      delete (mockNavigatorNoConnection as any).connection;
      global.navigator = mockNavigatorNoConnection as any;
      
      const result = monitorNetworkPerformance();
      expect(result).toBeNull();
    });
  });
});