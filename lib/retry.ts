import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 * Useful for handling temporary network failures or rate limits
 */
export async function retryAsync<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoffMultiplier = 2, onRetry } = options;

  let lastError: Error | null = null;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        logger.error(`Failed after ${maxAttempts} attempts:`, lastError);
        throw lastError;
      }

      logger.warn(`Attempt ${attempt} failed, retrying in ${currentDelay}ms...`, lastError);

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }

  // This should never be reached, but TypeScript requires it
  throw lastError || new Error('Retry failed');
}

/**
 * Check if an error is retryable (network errors, timeouts, 5xx responses)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  return false;
}

/**
 * Retry with automatic detection of retryable errors
 */
export async function retryWithCheck<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  try {
    return await retryAsync(fn, options);
  } catch (error) {
    if (isRetryableError(error)) {
      // Already retried, but still failing
      throw new Error('Operation failed after multiple retries. Please check your connection and try again.');
    }
    throw error;
  }
}
