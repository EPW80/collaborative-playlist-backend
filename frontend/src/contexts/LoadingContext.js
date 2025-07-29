import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Loading state context for managing UI loading states
 */
const LoadingContext = createContext();

/**
 * Loading states enum
 */
export const LoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Loading state provider component
 */
export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});

  const setLoading = useCallback((key, state, error = null) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { state, error, timestamp: Date.now() }
    }));
  }, []);

  const isLoading = useCallback((key) => {
    return loadingStates[key]?.state === LoadingStates.LOADING;
  }, [loadingStates]);

  const getLoadingState = useCallback((key) => {
    return loadingStates[key] || { state: LoadingStates.IDLE, error: null };
  }, [loadingStates]);

  const clearLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const value = {
    setLoading,
    isLoading,
    getLoadingState,
    clearLoading,
    LoadingStates
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

/**
 * Hook to use loading state
 */
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

/**
 * Hook for async operations with automatic loading state management
 */
export const useAsyncOperation = (key) => {
  const { setLoading, isLoading, getLoadingState } = useLoading();

  const execute = useCallback(async (asyncFunction, ...args) => {
    try {
      setLoading(key, LoadingStates.LOADING);
      const result = await asyncFunction(...args);
      setLoading(key, LoadingStates.SUCCESS);
      return result;
    } catch (error) {
      setLoading(key, LoadingStates.ERROR, error.message);
      throw error;
    }
  }, [key, setLoading]);

  return {
    execute,
    isLoading: isLoading(key),
    state: getLoadingState(key)
  };
};
