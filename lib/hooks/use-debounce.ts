import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Creates a debounced version of a function
 * The function will only be called after the specified delay has passed
 * since the last invocation
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Creates a throttled version of a function
 * The function will be called at most once per specified interval
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Hook for creating a debounced callback
 * Automatically cleans up on unmount
 */
export function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}

/**
 * Hook for creating a throttled callback
 */
export function useThrottle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  limit: number,
): (...args: Parameters<T>) => void {
  const inThrottleRef = useRef(false);
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottleRef.current) {
        callbackRef.current(...args);
        inThrottleRef.current = true;
        setTimeout(() => {
          inThrottleRef.current = false;
        }, limit);
      }
    },
    [limit],
  );
}

/**
 * Hook that returns a debounced value
 * Useful for search inputs, etc.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
