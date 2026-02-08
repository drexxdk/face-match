'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    const variantClasses = {
      default: 'bg-gradient-primary',
      success: 'bg-[hsl(142_76%_36%)]',
      warning: 'bg-[hsl(38_92%_50%)]',
      destructive: 'bg-destructive',
    };

    return (
      <div
        ref={ref}
        className={cn('bg-secondary relative h-2 w-full overflow-hidden rounded-full', className)}
        {...props}
      >
        <div
          className={cn('h-full w-full flex-1 transition-all duration-300 ease-in-out', variantClasses[variant])}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  },
);

Progress.displayName = 'Progress';

export { Progress };

// Circular Progress for timer
interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  className,
  children,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage > 50) return 'hsl(142 76% 36%)'; // green
    if (percentage > 25) return 'hsl(38 92% 50%)'; // orange
    return 'hsl(0 84.2% 60.2%)'; // red
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(240 3.8% 46.1% / 0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
