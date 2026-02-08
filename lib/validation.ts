import { z } from 'zod';

/**
 * Validation schemas for common inputs
 */

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const emailSchema = z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters');

export const gameCodeSchema = z
  .string()
  .length(6, 'Game code must be 6 characters')
  .regex(/^[A-Z0-9]+$/, 'Game code can only contain uppercase letters and numbers');

export const groupNameSchema = z
  .string()
  .min(1, 'Group name is required')
  .max(100, 'Group name must be less than 100 characters');

export const timeLimitSchema = z
  .number()
  .int('Time limit must be a whole number')
  .min(10, 'Time limit must be at least 10 seconds')
  .max(300, 'Time limit must be no more than 300 seconds (5 minutes)');

export const optionsCountSchema = z
  .number()
  .int('Options count must be a whole number')
  .min(2, 'Must have at least 2 options')
  .max(10, 'Cannot have more than 10 options');

/**
 * Validate and sanitize input with detailed error messages
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(value);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const firstError = result.error.issues[0];
  return {
    success: false,
    error: firstError?.message || 'Validation failed',
  };
}

/**
 * Rate limiting helper for client-side
 * Returns true if action is allowed, false if rate limited
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts: number,
    private windowMs: number,
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.attempts.get(key) || [];

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter((timestamp) => now - timestamp < this.windowMs);

    if (validTimestamps.length >= this.maxAttempts) {
      return false;
    }

    validTimestamps.push(now);
    this.attempts.set(key, validTimestamps);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Sanitize HTML to prevent XSS
 * For simple text display - strips all HTML tags
 */
export function sanitizeHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {},
): { valid: true } | { valid: false; error: string } {
  const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}
