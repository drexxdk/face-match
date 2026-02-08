/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return str.replace(/[&<>"'`=/]/g, (char) => htmlEscapes[char]);
}

/**
 * Strips HTML tags from a string
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 * while preserving alphanumeric, spaces, and common punctuation
 */
export function sanitizeString(str: string): string {
  // Remove null bytes and control characters (except newlines and tabs)
  const cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  return cleaned.trim();
}

/**
 * Sanitizes a name (first name, last name, etc.)
 * Allows letters, spaces, hyphens, and apostrophes
 */
export function sanitizeName(str: string): string {
  // Remove anything that's not a letter, number, space, hyphen, or apostrophe
  const sanitized = str.replace(/[^a-zA-Z0-9\s\-'À-ÿ]/g, '');

  // Collapse multiple spaces into one
  return sanitized.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes a group name
 * Allows alphanumeric, spaces, and common punctuation
 */
export function sanitizeGroupName(str: string): string {
  // Allow alphanumeric, spaces, and basic punctuation
  const sanitized = str.replace(/[^a-zA-Z0-9\s\-_'.!&]/g, '');

  // Collapse multiple spaces into one
  return sanitized.replace(/\s+/g, ' ').trim();
}

/**
 * Validates and sanitizes a session/game code
 * Allows only uppercase letters and numbers
 */
export function sanitizeGameCode(str: string): string {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Validates a UUID format
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Sanitizes an object's string properties recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    stripHtml?: boolean;
    escapeHtml?: boolean;
  } = {},
): T {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];

    if (typeof value === 'string') {
      let sanitized = sanitizeString(value);
      if (options.stripHtml) {
        sanitized = stripHtml(sanitized);
      }
      if (options.escapeHtml) {
        sanitized = escapeHtml(sanitized);
      }
      (result as Record<string, unknown>)[key] = sanitized;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>, options);
    }
  }

  return result;
}

/**
 * Validates that a string doesn't exceed a maximum length
 */
export function validateLength(str: string, maxLength: number, minLength = 0): boolean {
  const length = str.length;
  return length >= minLength && length <= maxLength;
}

/**
 * Truncates a string to a maximum length, adding ellipsis if truncated
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}
