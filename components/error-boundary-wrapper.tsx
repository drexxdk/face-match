'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ErrorBoundaryWrapper({ children, className }: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary className={className}>{children}</ErrorBoundary>;
}
