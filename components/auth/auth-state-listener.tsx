'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

/**
 * Component that listens for auth state changes and handles session expiration
 * Add this to your layout to automatically redirect users when their session expires
 */
export function AuthStateListener() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const supabase = createClient();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'TOKEN_REFRESHED') {
        // Token was successfully refreshed
        logger.log('Auth token refreshed');
      }

      if (event === 'SIGNED_OUT') {
        // Check if this was an intentional logout
        const wasIntentional = sessionStorage.getItem('intentional_logout');
        sessionStorage.removeItem('intentional_logout');

        // Only show session expired message if not intentional
        // and on a admin route
        const pathname = window.location.pathname;
        if (!wasIntentional && pathname?.startsWith('/admin')) {
          toast.error('Your session has expired. Please log in again.');
          router.push('/auth/login');
        }
      }

      if (event === 'USER_UPDATED') {
        // Refresh the page to get updated user data
        router.refresh();
      }
    });

    // Check session validity on mount
    const checkSession = async () => {
      const pathname = window.location.pathname;
      const { error } = await supabase.auth.getSession();

      if (error?.message?.includes('expired') || error?.message?.includes('Invalid')) {
        // Session is invalid, try to refresh
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError && pathname?.startsWith('/admin')) {
          toast.error('Your session has expired. Please log in again.');
          router.push('/auth/login');
        }
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, mounted]);

  return null;
}
