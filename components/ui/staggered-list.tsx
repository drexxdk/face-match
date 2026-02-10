'use client';

import { ReactNode } from 'react';

interface StaggeredListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ children, className }: StaggeredListProps) {
  return <div className={className}>{children}</div>;
}

interface StaggeredItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export function StaggeredItem({ children, className }: StaggeredItemProps) {
  return <div className={className}>{children}</div>;
}

// Grid variant with scale effect
export function StaggeredGrid({ children, className }: Omit<StaggeredListProps, 'staggerDelay'>) {
  return <div className={className}>{children}</div>;
}

export function StaggeredGridItem({ children, className }: StaggeredItemProps) {
  return <div className={className}>{children}</div>;
}
