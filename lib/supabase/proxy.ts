import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasEnvVars } from '../utils';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '../security';
import type { Database } from '@/lib/database.types';

/**
 * Get client identifier for rate limiting
 * Uses IP address with fallback to a default value
 */
function getClientIdentifier(request: NextRequest): string {
  // Try various headers for the real IP (when behind proxy/CDN)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback - in development or when no proxy
  return request.headers.get('x-vercel-ip') || 'anonymous';
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Apply rate limiting to API routes
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    const clientId = getClientIdentifier(request);
    const isAuthRoute = pathname.startsWith('/auth/');
    const rateLimitConfig = isAuthRoute ? RATE_LIMITS.auth : RATE_LIMITS.api;

    const rateLimitResult = checkRateLimit(clientId, rateLimitConfig);

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: rateLimitResult.resetInSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateLimitResult),
          },
        },
      );
    }

    // Add rate limit headers to successful responses
    const headers = getRateLimitHeaders(rateLimitResult);
    for (const [key, value] of Object.entries(headers)) {
      supabaseResponse.headers.set(key, value);
    }
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (
    request.nextUrl.pathname !== '/' &&
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/game')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
