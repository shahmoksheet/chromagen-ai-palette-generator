// Performance monitoring utilities
import React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime, {
          element: (lastEntry as any).element?.tagName,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime, {
            eventType: entry.name,
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`Performance Metric - ${name}:`, value, metadata);
    }

    // Send to analytics in production
    if (import.meta.env.PROD) {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // In production, send to analytics service
    // For now, just store in localStorage for debugging
    try {
      const stored = localStorage.getItem('chromagen-performance-metrics');
      const metrics = stored ? JSON.parse(stored) : [];
      metrics.push(metric);
      
      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }
      
      localStorage.setItem('chromagen-performance-metrics', JSON.stringify(metrics));
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for measuring custom performance
export const measureAsync = async <T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(name, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(`${name}_error`, duration, { 
      ...metadata, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};

export const measureSync = <T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T => {
  const startTime = performance.now();
  
  try {
    const result = fn();
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(name, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(`${name}_error`, duration, { 
      ...metadata, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
};

// React hook for measuring component render time
export const useMeasureRender = (componentName: string) => {
  const renderStartTime = performance.now();
  
  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime;
    performanceMonitor.recordMetric(`${componentName}_render`, renderTime);
  });
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (typeof window !== 'undefined' && 'performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );
    
    const cssResources = resources.filter(resource => 
      resource.name.includes('.css')
    );
    
    const totalJSSize = jsResources.reduce((acc, resource) => 
      acc + (resource.transferSize || 0), 0
    );
    
    const totalCSSSize = cssResources.reduce((acc, resource) => 
      acc + (resource.transferSize || 0), 0
    );
    
    performanceMonitor.recordMetric('bundle_js_size', totalJSSize);
    performanceMonitor.recordMetric('bundle_css_size', totalCSSSize);
    
    return {
      jsSize: totalJSSize,
      cssSize: totalCSSSize,
      jsResources: jsResources.length,
      cssResources: cssResources.length,
    };
  }
  
  return null;
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
    const memory = (performance as any).memory;
    
    performanceMonitor.recordMetric('memory_used', memory.usedJSHeapSize);
    performanceMonitor.recordMetric('memory_total', memory.totalJSHeapSize);
    performanceMonitor.recordMetric('memory_limit', memory.jsHeapSizeLimit);
    
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  
  return null;
};

// Network performance monitoring
export const monitorNetworkPerformance = () => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'connection' in navigator) {
    const connection = (navigator as any).connection;
    
    performanceMonitor.recordMetric('network_downlink', connection.downlink);
    performanceMonitor.recordMetric('network_rtt', connection.rtt);
    
    return {
      downlink: connection.downlink,
      rtt: connection.rtt,
      effectiveType: connection.effectiveType,
      saveData: connection.saveData,
    };
  }
  
  return null;
};