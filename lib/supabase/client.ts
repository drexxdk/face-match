import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  );
}

/**
 * Check if the current session is valid, refresh if needed
 * Call this before making authenticated requests
 */
export async function ensureValidSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    // No valid session, user needs to log in again
    return { valid: false, session: null };
  }

  // Check if token is about to expire (within 60 seconds)
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);

  if (expiresAt && expiresAt - now < 60) {
    // Token is about to expire, try to refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError || !refreshData.session) {
      return { valid: false, session: null };
    }

    return { valid: true, session: refreshData.session };
  }

  return { valid: true, session };
}
