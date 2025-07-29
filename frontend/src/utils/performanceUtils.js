import React, { useMemo, useCallback, startTransition } from 'react';

/**
 * Performance optimization hooks for React components
 */

/**
 * Hook to wrap state updates in React 18's startTransition for better performance
 */
export const useOptimizedState = (setState) => {
  return useCallback((newState) => {
    startTransition(() => {
      setState(newState);
    });
  }, [setState]);
};

/**
 * Hook for memoizing expensive computations with dependencies
 */
export const useOptimizedMemo = (factory, deps, debugName) => {
  return useMemo(() => {
    const startTime = performance.now();
    const result = factory();
    const endTime = performance.now();
    
    if (process.env.NODE_ENV === 'development' && debugName) {
      console.debug(`🧮 ${debugName} computation took ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * Hook for memoizing callback functions with performance monitoring
 */
export const useOptimizedCallback = (callback, deps, debugName) => {
  return useCallback((...args) => {
    const startTime = performance.now();
    const result = callback(...args);
    const endTime = performance.now();
    
    if (process.env.NODE_ENV === 'development' && debugName && (endTime - startTime) > 16) {
      console.warn(`⚠️ ${debugName} callback took ${(endTime - startTime).toFixed(2)}ms (>16ms threshold)`);
    }
    
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

/**
 * Hook for batching multiple state updates
 */
export const useBatchedUpdates = () => {
  return useCallback((updates) => {
    startTransition(() => {
      // Execute all updates in a single transition
      updates.forEach(update => {
        if (typeof update === 'function') {
          update();
        }
      });
    });
  }, []);
};

/**
 * Higher-order component for performance monitoring
 */
export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return React.memo((props) => {
    const renderStartTime = useMemo(() => performance.now(), []);
    
    React.useEffect(() => {
      const renderEndTime = performance.now();
      const renderTime = renderEndTime - renderStartTime;
      
      if (renderTime > 16) { // If render took longer than one frame
        console.warn(`⚠️ ${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    });
    
    return <WrappedComponent {...props} />;
  });
};
