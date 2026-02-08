'use client';

import { useState, useCallback } from 'react';
import { getErrorMessage } from '@/lib/logger';

export function useFormState() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async <T>(action: () => Promise<T>): Promise<T | undefined> => {
    setIsLoading(true);
    setError(null);
    try {
      return await action();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, isLoading, execute, setError, clearError };
}
