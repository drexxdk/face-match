/**
 * Performance monitoring utilities for development
 */

import { logger } from '@/lib/logger';

const isProduction = process.env.NODE_ENV === 'production';

interface PerformanceMark {
  name: string;
  startTime: number;
}

const marks = new Map<string, PerformanceMark>();

/**
 * Start measuring performance for a named operation
 */
export function perfStart(name: string): void {
  if (isProduction) return;

  marks.set(name, {
    name,
    startTime: performance.now(),
  });
}

/**
 * End measuring and log the duration
 */
export function perfEnd(name: string): number | null {
  if (isProduction) return null;

  const mark = marks.get(name);
  if (!mark) {
    logger.log(`⚠️ Performance mark "${name}" not found`);
    return null;
  }

  const duration = performance.now() - mark.startTime;
  marks.delete(name);

  logger.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
  return duration;
}

/**
 * Measure a function's execution time
 */
export async function perfMeasure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
  if (isProduction) {
    return fn();
  }

  perfStart(name);
  try {
    const result = await fn();
    perfEnd(name);
    return result;
  } catch (error) {
    perfEnd(name);
    throw error;
  }
}

/**
 * Report Web Vitals metrics
 * Use with Next.js web-vitals reporting
 */
export function reportWebVitals(metric: { id: string; name: string; value: number; label: string }): void {
  if (isProduction) {
    // In production, send to analytics service
    // Example: Send to Google Analytics, Vercel Analytics, etc.
    return;
  }

  const { name, value, label } = metric;
  logger.log(`📊 ${name} (${label}): ${value.toFixed(2)}`);
}

/**
 * Measure component render time (use in useEffect)
 */
export function useRenderTime(componentName: string): void {
  if (isProduction) return;

  const startTime = performance.now();

  // This runs after render
  setTimeout(() => {
    const duration = performance.now() - startTime;
    if (duration > 16) {
      // Longer than one frame (60fps)
      logger.log(`🐢 Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  }, 0);
}

/**
 * Log memory usage (development only)
 */
export function logMemoryUsage(): void {
  if (isProduction || typeof window === 'undefined') return;

  const memory = (
    performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
      };
    }
  ).memory;

  if (memory) {
    const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
    logger.log(`💾 Memory: ${usedMB}MB / ${totalMB}MB`);
  }
}
