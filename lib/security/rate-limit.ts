/**
 * Simple in-memory rate limiting for API routes
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// Note: This resets on server restart and doesn't work across multiple instances
// For production, use Redis or Upstash
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Optional identifier prefix for different rate limit buckets */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
  limit: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const { limit, windowSeconds, prefix = 'default' } = config;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();

  // Clean up expired entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  const entry = rateLimitStore.get(key);

  // If no entry exists or the window has expired, create a new one
  if (!entry || now >= entry.resetTime) {
    const resetTime = now + windowSeconds * 1000;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
      limit,
    };
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetInSeconds,
      limit,
    };
  }

  // Increment counter
  entry.count++;
  const resetInSeconds = Math.ceil((entry.resetTime - now) / 1000);

  return {
    success: true,
    remaining: limit - entry.count,
    resetInSeconds,
    limit,
  };
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Reset rate limit for a specific identifier
 */
export function resetRateLimit(identifier: string, prefix = 'default'): void {
  const key = `${prefix}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetInSeconds.toString(),
  };
}

// Preset configurations for different use cases
export const RATE_LIMITS = {
  /** Standard API calls - 100 requests per minute */
  api: { limit: 100, windowSeconds: 60, prefix: 'api' },

  /** Authentication attempts - 30 per minute (allows for page reloads and retries) */
  auth: { limit: 30, windowSeconds: 60, prefix: 'auth' },

  /** Game session creation - 10 per minute */
  createSession: { limit: 10, windowSeconds: 60, prefix: 'create-session' },

  /** File uploads - 20 per minute */
  upload: { limit: 20, windowSeconds: 60, prefix: 'upload' },

  /** Sensitive operations - 3 per minute */
  sensitive: { limit: 3, windowSeconds: 60, prefix: 'sensitive' },
} as const;
