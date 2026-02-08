'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getErrorMessage } from '@/lib/logger';

interface UseAsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: () => Promise<T | undefined>;
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Hook for managing async operations with loading, error, and data states.
 * Automatically executes on mount if immediate is true (default).
 *
 * @param asyncFn - The async function to execute
 * @param options - Configuration options
 * @param options.immediate - Whether to execute immediately on mount (default: true)
 * @param options.deps - Dependencies that trigger re-execution when changed
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: {
    immediate?: boolean;
    deps?: unknown[];
  } = {},
): UseAsyncReturn<T> {
  const { immediate = true, deps = [] } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    isLoading: immediate,
  });

  const mountedRef = useRef(true);

  const execute = useCallback(async (): Promise<T | undefined> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await asyncFn();
      if (mountedRef.current) {
        setState({ data: result, error: null, isLoading: false });
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          error: getErrorMessage(err),
          isLoading: false,
        }));
      }
      return undefined;
    }
  }, [asyncFn]);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return {
    ...state,
    execute,
    setData,
    setError,
    reset,
  };
}

/**
 * Hook for managing async mutations (form submissions, etc.)
 * Does NOT execute automatically - only on explicit execute() call.
 */
export function useMutation<T, TArgs extends unknown[] = []>(
  mutationFn: (...args: TArgs) => Promise<T>,
): {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  execute: (...args: TArgs) => Promise<T | undefined>;
  setError: (error: string | null) => void;
  reset: () => void;
} {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const mountedRef = useRef(true);

  const execute = useCallback(
    async (...args: TArgs): Promise<T | undefined> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await mutationFn(...args);
        if (mountedRef.current) {
          setState({ data: result, error: null, isLoading: false });
        }
        return result;
      } catch (err) {
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            error: getErrorMessage(err),
            isLoading: false,
          }));
        }
        return undefined;
      }
    },
    [mutationFn],
  );

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    execute,
    setError,
    reset,
  };
}
