/**
 * CSRF protection utilities
 * Uses the double-submit cookie pattern with signed tokens
 */

import { cookies } from 'next/headers';
import { createHmac, randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = '__Host-csrf';
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'default-dev-secret';

/**
 * Generate a CSRF token and set it as a cookie
 */
export async function generateCsrfToken(): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const signature = createHmac('sha256', CSRF_SECRET).update(token).digest('hex');
  const signedToken = `${token}.${signature}`;

  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  return signedToken;
}

/**
 * Verify a CSRF token against the cookie
 */
export async function verifyCsrfToken(token: string): Promise<boolean> {
  if (!token) return false;

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) return false;

  // Verify signature
  const [rawToken, signature] = token.split('.');
  if (!rawToken || !signature) return false;

  const expectedSignature = createHmac('sha256', CSRF_SECRET).update(rawToken).digest('hex');

  // Timing-safe comparison
  if (signature.length !== expectedSignature.length) return false;

  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  if (mismatch !== 0) return false;

  // Check that cookie matches submitted token
  return cookieToken === token;
}

/**
 * Server action wrapper that validates CSRF token
 */
export function withCsrfProtection<T extends unknown[], R>(
  action: (...args: T) => Promise<R>,
): (csrfToken: string, ...args: T) => Promise<R> {
  return async (csrfToken: string, ...args: T) => {
    const isValid = await verifyCsrfToken(csrfToken);
    if (!isValid) {
      throw new Error('Invalid CSRF token');
    }
    return action(...args);
  };
}
