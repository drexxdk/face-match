'use client';

import { cn } from '@/lib/utils';

interface AnimatedIconProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'bounce' | 'rotate' | 'scale' | 'pulse' | 'shake';
}

export function AnimatedIcon({ children, className }: AnimatedIconProps) {
  return <div className={cn('inline-flex', className)}>{children}</div>;
}
