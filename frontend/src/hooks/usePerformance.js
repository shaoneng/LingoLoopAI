import { useEffect, useRef } from 'react';

// 简化的性能 Hook，适配静态导出
export function usePerformance() {
  const performanceRef = useRef({
    startTime: null,
    endTime: null,
    trackComponent: (name) => {
      console.log(`[Performance] Component rendered: ${name}`);
    },
    lazyLoadComponent: (name) => {
      console.log(`[Performance] Lazy loading component: ${name}`);
    },
    debounce: (fn, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    },
    throttle: (fn, delay) => {
      let lastCall = 0;
      return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          return fn.apply(this, args);
        }
      };
    }
  });

  return performanceRef.current;
}

export function useComponentPerformance(componentName) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
    };
  }, [componentName]);

  return {
    startRender: () => {},
    endRender: () => {}
  };
}