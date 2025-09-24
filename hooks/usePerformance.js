import { useEffect, useState, useCallback, useRef } from 'react';
import performanceMonitor, {
  usePerformanceMonitoring,
  useRenderPerformance,
  prefetchResource,
  analyzeBundleSize,
} from '../utils/performance';

/**
 * Performance optimization hook
 * Provides lazy loading, caching, and performance monitoring
 */
export const usePerformance = () => {
  const { metrics, trackMetric, measure } = usePerformanceMonitoring();
  const [bundleAnalysis, setBundleAnalysis] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [effectiveConnection, setEffectiveConnection] = useState(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      trackMetric('connection_restored', 1);
    };

    const handleOffline = () => {
      setIsOnline(false);
      trackMetric('connection_lost', 1);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [trackMetric]);

  // Monitor network conditions
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;

      const updateConnectionInfo = () => {
        setEffectiveConnection({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  // Analyze bundle size periodically
  useEffect(() => {
    const analyze = () => {
      const analysis = analyzeBundleSize();
      if (analysis) {
        setBundleAnalysis(analysis);
        trackMetric('bundle_size', analysis.totalSize);
        trackMetric('bundle_load_time', analysis.totalLoadTime);
      }
    };

    // Analyze after page load
    const timer = setTimeout(analyze, 3000);

    // Analyze periodically
    const interval = setInterval(analyze, 30000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [trackMetric]);

  // Performance optimization utilities
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  const throttle = useCallback((func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }, []);

  const memoize = useCallback((func, resolver) => {
    const cache = new Map();
    return function memoized(...args) {
      const key = resolver ? resolver(...args) : JSON.stringify(args);
      if (cache.has(key)) {
        trackMetric('cache_hit', 1, { function: func.name });
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      trackMetric('cache_miss', 1, { function: func.name });
      return result;
    };
  }, [trackMetric]);

  // Lazy loading utilities
  const lazyLoadComponent = useCallback((importFn, options = {}) => {
    const startTime = performance.now();

    return importFn().then((module) => {
      const loadTime = performance.now() - startTime;
      trackMetric('lazy_component_load_time', loadTime, {
        component: importFn.toString(),
      });
      return module;
    }).catch((error) => {
      trackMetric('lazy_component_load_error', 1, {
        component: importFn.toString(),
        error: error.message,
      });
      throw error;
    });
  }, [trackMetric]);

  const lazyLoadImage = useCallback((src, options = {}) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const startTime = performance.now();

      img.onload = () => {
        const loadTime = performance.now() - startTime;
        trackMetric('lazy_image_load_time', loadTime, { src });
        resolve(img);
      };

      img.onerror = () => {
        trackMetric('lazy_image_load_error', 1, { src });
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }, [trackMetric]);

  // Resource prefetching
  const prefetchResources = useCallback((resources) => {
    resources.forEach((resource) => {
      try {
        prefetchResource(resource.href, resource.as);
        trackMetric('resource_prefetch', 1, { href: resource.href });
      } catch (error) {
        trackMetric('resource_prefetch_error', 1, {
          href: resource.href,
          error: error.message,
        });
      }
    });
  }, [trackMetric]);

  // Performance measurement utilities
  const measureFunction = useCallback(async (name, fn) => {
    return measure(name, fn);
  }, [measure]);

  const trackComponentRender = useCallback((componentName, renderTime) => {
    performanceMonitor.trackComponentRender(componentName, renderTime);
  }, []);

  // Adaptive loading based on network conditions
  const shouldLoadResource = useCallback((priority = 'medium') => {
    if (!isOnline) return false;

    const priorityThresholds = {
      high: { slow: '4g', fast: '3g' },
      medium: { slow: '3g', fast: '2g' },
      low: { slow: '2g', fast: 'slow-2g' },
    };

    const threshold = priorityThresholds[priority];
    if (!effectiveConnection) return true;

    return effectiveConnection.effectiveType !== threshold.slow &&
           effectiveConnection.effectiveType !== threshold.fast;
  }, [isOnline, effectiveConnection]);

  // Performance recommendations
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations = [];

    // Bundle size recommendations
    if (bundleAnalysis) {
      if (bundleAnalysis.totalSize > 500 * 1024) {
        recommendations.push({
          type: 'bundle_size',
          severity: 'high',
          message: 'Bundle size is large (>500KB). Consider code splitting and tree shaking.',
        });
      }

      if (bundleAnalysis.resourceCount > 20) {
        recommendations.push({
          type: 'resource_count',
          severity: 'medium',
          message: 'Too many resources loaded. Consider bundling and lazy loading.',
        });
      }
    }

    // Performance metrics recommendations
    if (metrics.fcp && metrics.fcp.value > 1800) {
      recommendations.push({
        type: 'fcp',
        severity: 'high',
        message: 'First Contentful Paint is slow. Optimize critical rendering path.',
      });
    }

    if (metrics.lcp && metrics.lcp.value > 2500) {
      recommendations.push({
        type: 'lcp',
        severity: 'high',
        message: 'Largest Contentful Paint is slow. Optimize images and fonts.',
      });
    }

    if (metrics.fid && metrics.fid.value > 100) {
      recommendations.push({
        type: 'fid',
        severity: 'medium',
        message: 'First Input Delay is high. Reduce main thread work.',
      });
    }

    // Network condition recommendations
    if (effectiveConnection) {
      if (effectiveConnection.saveData) {
        recommendations.push({
          type: 'data_saver',
          severity: 'low',
          message: 'User has data saver enabled. Consider loading lighter assets.',
        });
      }

      if (effectiveConnection.effectiveType === 'slow-2g' ||
          effectiveConnection.effectiveType === '2g') {
        recommendations.push({
          type: 'slow_network',
          severity: 'medium',
          message: 'Slow network detected. Implement progressive loading.',
        });
      }
    }

    return recommendations;
  }, [bundleAnalysis, metrics, effectiveConnection]);

  // Performance scoring
  const getPerformanceScore = useCallback(() => {
    let score = 100;
    let deductions = [];

    // Deduct for poor metrics
    if (metrics.fcp && metrics.fcp.value > 1800) {
      const deduction = Math.min((metrics.fcp.value - 1800) / 50, 30);
      score -= deduction;
      deductions.push({ metric: 'fcp', deduction });
    }

    if (metrics.lcp && metrics.lcp.value > 2500) {
      const deduction = Math.min((metrics.lcp.value - 2500) / 50, 30);
      score -= deduction;
      deductions.push({ metric: 'lcp', deduction });
    }

    if (metrics.fid && metrics.fid.value > 100) {
      const deduction = Math.min((metrics.fid.value - 100) / 5, 20);
      score -= deduction;
      deductions.push({ metric: 'fid', deduction });
    }

    if (metrics.cls && metrics.cls.value > 0.1) {
      const deduction = Math.min((metrics.cls.value - 0.1) * 100, 20);
      score -= deduction;
      deductions.push({ metric: 'cls', deduction });
    }

    return {
      score: Math.max(0, Math.round(score)),
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      deductions,
    };
  }, [metrics]);

  return {
    // Core performance data
    metrics,
    bundleAnalysis,
    isOnline,
    effectiveConnection,

    // Optimization utilities
    debounce,
    throttle,
    memoize,

    // Lazy loading
    lazyLoadComponent,
    lazyLoadImage,
    shouldLoadResource,

    // Resource management
    prefetchResources,

    // Performance measurement
    measureFunction,
    trackComponentRender,

    // Analytics and insights
    getPerformanceRecommendations,
    getPerformanceScore,

    // Performance monitoring instance
    performanceMonitor,
  };
};

/**
 * Hook for measuring component render performance
 */
export const useComponentPerformance = (componentName) => {
  const { startRender, endRender, renderCount } = useRenderPerformance(componentName);
  const renderTimes = useRef([]);
  const lastRenderTime = useRef(0);

  const startMeasurement = useCallback(() => {
    startRender();
    lastRenderTime.current = performance.now();
  }, [startRender]);

  const endMeasurement = useCallback(() => {
    const result = endRender();
    const renderTime = performance.now() - lastRenderTime.current;

    renderTimes.current.push(renderTime);

    // Keep only last 10 renders
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }

    return {
      ...result,
      averageRenderTime: renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length,
      lastRenderTime: renderTime,
      renderTimes: [...renderTimes.current],
    };
  }, [endRender]);

  return {
    startRender: startMeasurement,
    endRender: endMeasurement,
    renderCount,
    getRenderStats: () => ({
      renderCount,
      averageRenderTime: renderTimes.current.length > 0
        ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
        : 0,
      lastRenderTime: lastRenderTime.current,
      renderTimes: [...renderTimes.current],
    }),
  };
};

/**
 * Hook for lazy loading data with caching
 */
export const useLazyData = (fetchFn, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = useRef(new Map());

  const loadData = useCallback(async (forceRefresh = false) => {
    const cacheKey = options.cacheKey || JSON.stringify(options.deps || []);

    // Check cache first
    if (!forceRefresh && cache.current.has(cacheKey)) {
      setData(cache.current.get(cacheKey));
      return cache.current.get(cacheKey);
    }

    setLoading(true);
    setError(null);

    try {
      const startTime = performance.now();
      const result = await fetchFn(...(options.deps || []));
      const loadTime = performance.now() - startTime;

      cache.current.set(cacheKey, result);

      // Cache cleanup - remove oldest items if cache is too large
      if (cache.current.size > (options.maxCacheSize || 50)) {
        const oldestKey = cache.current.keys().next().value;
        cache.current.delete(oldestKey);
      }

      setData(result);
      setLoading(false);

      return result;
    } catch (err) {
      setError(err);
      setLoading(false);
      throw err;
    }
  }, [fetchFn, options]);

  useEffect(() => {
    if (options.autoLoad !== false) {
      loadData();
    }
  }, [loadData, options.autoLoad]);

  return {
    data,
    loading,
    error,
    refetch: () => loadData(true),
    mutate: (newData) => {
      const cacheKey = options.cacheKey || JSON.stringify(options.deps || []);
      cache.current.set(cacheKey, newData);
      setData(newData);
    },
  };
};

export default usePerformance;