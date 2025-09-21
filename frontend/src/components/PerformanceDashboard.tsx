import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  // Info // Not used in this component
} from 'lucide-react';
import { performanceMonitor } from '../utils/performance';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface MetricSummary {
  name: string;
  current: number;
  average: number;
  min: number;
  max: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'error';
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics());
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics();

    return () => clearInterval(interval);
  }, []);

  const metricSummaries = useMemo(() => {
    const summaries: Record<string, MetricSummary> = {};
    
    // Group metrics by name
    const groupedMetrics = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    // Calculate summaries
    Object.entries(groupedMetrics).forEach(([name, metricList]) => {
      const values = metricList.map(m => m.value);
      const current = values[values.length - 1] || 0;
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Calculate trend (comparing last 3 values with previous 3)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (values.length >= 6) {
        const recent = values.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
        const previous = values.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
        const change = (recent - previous) / previous;
        
        if (change > 0.1) trend = 'up';
        else if (change < -0.1) trend = 'down';
      }
      
      // Determine status based on metric type and values
      let status: 'good' | 'warning' | 'error' = 'good';
      if (name.includes('error') || name.includes('fail')) {
        status = current > 0 ? 'error' : 'good';
      } else if (name.includes('render') || name.includes('api')) {
        if (current > 1000) status = 'error';
        else if (current > 500) status = 'warning';
      } else if (name === 'LCP') {
        if (current > 4000) status = 'error';
        else if (current > 2500) status = 'warning';
      } else if (name === 'FID') {
        if (current > 300) status = 'error';
        else if (current > 100) status = 'warning';
      } else if (name === 'CLS') {
        if (current > 0.25) status = 'error';
        else if (current > 0.1) status = 'warning';
      }
      
      summaries[name] = {
        name,
        current,
        average,
        min,
        max,
        count: values.length,
        trend,
        status,
      };
    });

    return Object.values(summaries);
  }, [metrics]);

  const coreWebVitals = useMemo(() => {
    return metricSummaries.filter(metric => 
      ['LCP', 'FID', 'CLS'].includes(metric.name)
    );
  }, [metricSummaries]);

  const customMetrics = useMemo(() => {
    return metricSummaries.filter(metric => 
      !['LCP', 'FID', 'CLS'].includes(metric.name)
    );
  }, [metricSummaries]);

  const formatValue = (value: number, metricName: string) => {
    if (metricName === 'CLS') {
      return value.toFixed(3);
    } else if (value < 1) {
      return `${(value * 1000).toFixed(1)}μs`;
    } else if (value < 1000) {
      return `${value.toFixed(1)}ms`;
    } else {
      return `${(value / 1000).toFixed(2)}s`;
    }
  };

  const getStatusColor = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable': return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Show Performance Dashboard"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Performance</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Core Web Vitals */}
      {coreWebVitals.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2 text-blue-600" />
            Core Web Vitals
          </h4>
          <div className="space-y-2">
            {coreWebVitals.map((metric) => (
              <div key={metric.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {getStatusIcon(metric.status)}
                    <span className="ml-1">{metric.name}</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-mono">{formatValue(metric.current, metric.name)}</span>
                  {getTrendIcon(metric.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Metrics */}
      {customMetrics.length > 0 && (
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-green-600" />
            Custom Metrics
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {customMetrics.slice(0, 10).map((metric) => (
              <div key={metric.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    metric.status === 'good' ? 'bg-green-400' :
                    metric.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className="text-gray-700 truncate max-w-32" title={metric.name}>
                    {metric.name.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-gray-600">
                    {formatValue(metric.current, metric.name)}
                  </span>
                  {getTrendIcon(metric.trend)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Metrics:</span>
            <span className="ml-2 font-semibold">{metrics.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Unique Types:</span>
            <span className="ml-2 font-semibold">{metricSummaries.length}</span>
          </div>
        </div>
        
        <button
          onClick={() => {
            performanceMonitor.clearMetrics();
            setMetrics([]);
          }}
          className="mt-3 w-full text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          Clear Metrics
        </button>
      </div>
    </motion.div>
  );
};

export default PerformanceDashboard;