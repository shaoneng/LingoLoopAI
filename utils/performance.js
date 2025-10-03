/**
 * Performance optimization utilities
 * Provides code splitting, lazy loading, and performance monitoring
 */

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';

// Performance monitoring configuration
const PERF_CONFIG = {
  // Lazy loading thresholds
  LAZY_LOAD_ROOT_MARGIN: '50px',
  LAZY_LOAD_THRESHOLD: 0.1,

  // Code splitting chunk size warnings
  CHUNK_SIZE_WARNING: 250 * 1024, // 250KB
  CHUNK_SIZE_ERROR: 500 * 1024,   // 500KB

  // Performance metrics
  FCP_THRESHOLD: 1800,  // First Contentful Paint (ms)
  LCP_THRESHOLD: 2500,  // Largest Contentful Paint (ms)
  FID_THRESHOLD: 100,   // First Input Delay (ms)
  CLS_THRESHOLD: 0.1,   // Cumulative Layout Shift

  // Cache configuration
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 100,     // Max cached items
};

// Performance monitoring class
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Set();
    this.isInitialized = false;
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.isInitialized) return;

    this.observeWebVitals();
    this.observeResourceTiming();
    this.observeNavigationTiming();

    this.isInitialized = true;
    console.log('🚀 Performance monitoring initialized');
  }

  /**
   * Track custom performance metric
   */
  trackMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.set(name, metric);
    this.notifyObservers(metric);

    // Log warnings for poor performance
    this.checkPerformanceThresholds(name, value);
  }

  /**
   * Get all collected metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Add performance observer
   */
  addObserver(callback) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  /**
   * Measure function execution time
   */
  async measure(name, fn) {
    const startTime = performance.now();

    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.trackMetric(`${name}_duration`, duration, {
        success: true,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.trackMetric(`${name}_duration`, duration, {
        success: false,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Track React component render performance
   */
  trackComponentRender(componentName, renderTime) {
    this.trackMetric(`component_${componentName}_render`, renderTime);
  }

  /**
   * Track resource load performance
   */
  trackResourceLoad(resourceName, loadTime, size) {
    this.trackMetric(`resource_${resourceName}_load`, loadTime, { size });

    // Warn about large resources
    if (size > PERF_CONFIG.CHUNK_SIZE_ERROR) {
      console.warn(`🚨 Large resource detected: ${resourceName} (${this.formatBytes(size)})`);
    } else if (size > PERF_CONFIG.CHUNK_SIZE_WARNING) {
      console.warn(`⚠️  Large resource: ${resourceName} (${this.formatBytes(size)})`);
    }
  }

  // Private methods
  observeWebVitals() {
    if (typeof window === 'undefined') return;

    // First Contentful Paint
    const observerFCP = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.trackMetric('fcp', entry.startTime);
        }
      });
    });

    // Largest Contentful Paint
    const observerLCP = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.trackMetric('lcp', entry.startTime);
      });
    });

    // First Input Delay
    const observerFID = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.trackMetric('fid', entry.processingStart - entry.startTime);
      });
    });

    // Cumulative Layout Shift
    const observerCLS = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.trackMetric('cls', entry.value);
      });
    });

    try {
      observerFCP.observe({ entryTypes: ['paint'] });
      observerLCP.observe({ entryTypes: ['largest-contentful-paint'] });
      observerFID.observe({ entryTypes: ['first-input'] });
      observerCLS.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('PerformanceObserver not fully supported:', error);
    }
  }

  observeResourceTiming() {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.initiatorType === 'script' || entry.initiatorType === 'link') {
          const resourceName = entry.name.split('/').pop() || entry.name;
          this.trackResourceLoad(resourceName, entry.duration, entry.transferSize || 0);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Resource timing observation failed:', error);
    }
  }

  observeNavigationTiming() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.trackMetric('page_load_time', navigation.loadEventEnd - navigation.loadEventStart);
        this.trackMetric('dom_complete', navigation.domComplete);
        this.trackMetric('dom_interactive', navigation.domInteractive);
      }
    });
  }

  checkPerformanceThresholds(name, value) {
    const thresholds = {
      fcp: PERF_CONFIG.FCP_THRESHOLD,
      lcp: PERF_CONFIG.LCP_THRESHOLD,
      fid: PERF_CONFIG.FID_THRESHOLD,
      cls: PERF_CONFIG.CLS_THRESHOLD,
    };

    const threshold = thresholds[name];
    if (threshold && value > threshold) {
      console.warn(`🐌 Performance issue: ${name} = ${value}ms (threshold: ${threshold}ms)`);
    }
  }

  notifyObservers(metric) {
    this.observers.forEach(callback => callback(metric));
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Lazy loading utilities
export const createLazyComponent = (importFn, fallback = null, errorComponent = null) => {
  const LazyComponent = React.lazy(importFn);

  return (props) => (
    <Suspense fallback={fallback || null}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Intersection Observer for lazy loading
export const useIntersectionObserver = (callback, options = {}) => {
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback(entry);
          observer.unobserve(ref);
        }
      },
      {
        rootMargin: PERF_CONFIG.LAZY_LOAD_ROOT_MARGIN,
        threshold: PERF_CONFIG.LAZY_LOAD_THRESHOLD,
        ...options,
      }
    );

    observer.observe(ref);

    return () => {
      observer.unobserve(ref);
    };
  }, [ref, callback, options]);

  return setRef;
};

// Image lazy loading hook
export const useLazyImage = (src, options = {}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const loadStartTimeRef = useRef(null);

  const handleIntersection = useCallback(() => {
    loadStartTimeRef.current = performance.now();
    setIsLoaded(false);
    setError(null);
    setImageSrc(src);
  }, [src]);

  const imageRef = useIntersectionObserver(handleIntersection, options);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    if (loadStartTimeRef.current !== null) {
      performanceMonitor.trackMetric(
        'image_load_time',
        performance.now() - loadStartTimeRef.current,
        { src }
      );
    }
  }, [src]);

  const handleError = useCallback((e) => {
    setError(e);
    performanceMonitor.trackMetric('image_load_error', 1, { src });
  }, [src]);

  useEffect(() => {
    setImageSrc(null);
    setIsLoaded(false);
    setError(null);
    loadStartTimeRef.current = null;
  }, [src]);

  return {
    ref: imageRef,
    src: imageSrc,
    isLoaded,
    error,
    handleLoad,
    handleError,
  };
};

// Route-based code splitting
export const createCodeSplitRoute = (importFn, fallback = null) => {
  const Component = React.lazy(importFn);

  return (props) => (
    <Suspense fallback={fallback || null}>
      <Component {...props} />
    </Suspense>
  );
};

// Performance monitoring hooks
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    performanceMonitor.init();

    const unsubscribe = performanceMonitor.addObserver((metric) => {
      setMetrics(prev => ({
        ...prev,
        [metric.name]: metric,
      }));
    });

    return unsubscribe;
  }, []);

  return {
    metrics,
    trackMetric: performanceMonitor.trackMetric.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    trackComponentRender: performanceMonitor.trackComponentRender.bind(performanceMonitor),
  };
};

// Component render performance hook
export const useRenderPerformance = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);

  const startRender = useCallback(() => {
    lastRenderTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    const renderTime = performance.now() - lastRenderTime.current;
    renderCount.current += 1;

    performanceMonitor.trackComponentRender(componentName, renderTime);

    return {
      renderTime,
      renderCount: renderCount.current,
    };
  }, [componentName]);

  return {
    startRender,
    endRender,
    renderCount: renderCount.current,
  };
};

// Resource prefetching
export const prefetchResource = (href, as = 'script') => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  link.as = as;

  document.head.appendChild(link);

  // Remove after timeout to prevent memory leaks
  setTimeout(() => {
    document.head.removeChild(link);
  }, 10000);
};

// Bundle analyzer helper
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined' || !performance?.getEntriesByType) {
    return null;
  }

  const resources = performance.getEntriesByType('resource');
  const bundleResources = resources.filter(r =>
    r.initiatorType === 'script' && (r.name.includes('.js') || r.name.includes('.chunk'))
  );

  const analysis = {
    totalSize: bundleResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
    totalLoadTime: bundleResources.reduce((sum, r) => sum + r.duration, 0),
    largestResource: bundleResources.reduce((largest, r) =>
      (r.transferSize || 0) > (largest.transferSize || 0) ? r : largest,
      bundleResources[0]
    ),
    slowestResource: bundleResources.reduce((slowest, r) =>
      r.duration > slowest.duration ? r : slowest,
      bundleResources[0]
    ),
    resourceCount: bundleResources.length,
    resources: bundleResources.map(r => ({
      name: r.name.split('/').pop(),
      size: r.transferSize,
      duration: r.duration,
    })),
  };

  return analysis;
};

// Export singleton instance
export default performanceMonitor;
