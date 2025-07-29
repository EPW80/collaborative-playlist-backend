/**
 * Debounce utility to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle utility to limit function calls to once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Batch UI updates to reduce re-renders
 * @param {Function} updateFunction - Function that updates state
 * @param {number} delay - Delay in milliseconds before executing batch
 * @returns {Function} Batched update function
 */
export const batchUpdates = (updateFunction, delay = 100) => {
  let pendingUpdates = [];
  let timeoutId = null;

  return (update) => {
    pendingUpdates.push(update);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      if (pendingUpdates.length > 0) {
        updateFunction(pendingUpdates);
        pendingUpdates = [];
      }
      timeoutId = null;
    }, delay);
  };
};
