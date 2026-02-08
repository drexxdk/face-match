'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useLoading } from '@/lib/loading-context';

/**
 * Custom hook that wraps Next.js router with automatic loading state management.
 * Use this instead of useRouter when navigating to show the loading overlay.
 */
export function useNavigate() {
  const router = useRouter();
  const { setLoading } = useLoading();

  const push = useCallback(
    (href: string) => {
      setLoading(true);
      router.push(href);
    },
    [router, setLoading],
  );

  const replace = useCallback(
    (href: string) => {
      setLoading(true);
      router.replace(href);
    },
    [router, setLoading],
  );

  const back = useCallback(() => {
    setLoading(true);
    router.back();
  }, [router, setLoading]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    push,
    replace,
    back,
    refresh,
    // Expose raw router for cases where loading state isn't needed
    router,
  };
}
