'use client';

import dynamic from 'next/dynamic';
import { ComponentType, ReactElement } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Loading fallback component
function ComponentLoader() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

// Game loading fallback
function GameLoader() {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center space-y-4">
      <Skeleton className="size-48 rounded-lg" />
      <Skeleton className="h-6 w-32" />
      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  );
}

/**
 * Creates a dynamically imported component with a loading fallback
 * Use this for large components that don't need to be in the initial bundle
 */
export function createLazyComponent<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  LoadingComponent: () => ReactElement = ComponentLoader,
) {
  return dynamic(importFn, {
    loading: () => <LoadingComponent />,
    ssr: true,
  });
}

/**
 * Creates a dynamically imported component that only loads on client
 * Use for components that depend on browser APIs
 */
export function createClientOnlyComponent<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  LoadingComponent: () => ReactElement = ComponentLoader,
) {
  return dynamic(importFn, {
    loading: () => <LoadingComponent />,
    ssr: false,
  });
}

// Export loading components for use elsewhere
export { ComponentLoader, GameLoader };
