'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/lib/loading-context';
import { ComponentProps, useCallback } from 'react';

type LoadingLinkProps = ComponentProps<typeof Link> & {
  prefetchOnHover?: boolean;
};

export function LoadingLink({ onClick, prefetchOnHover = true, prefetch = false, ...props }: LoadingLinkProps) {
  const { setLoading } = useLoading();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setLoading(true);
    onClick?.(e);
  };

  const handleMouseEnter = useCallback(() => {
    if (prefetchOnHover && typeof props.href === 'string') {
      router.prefetch(props.href);
    }
  }, [prefetchOnHover, props.href, router]);

  return <Link {...props} prefetch={prefetch} onClick={handleClick} onMouseEnter={handleMouseEnter} />;
}
