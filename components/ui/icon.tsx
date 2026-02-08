import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { IconType } from 'react-icons';

import { cn } from '@/lib/utils';

const iconVariants = cva('shrink-0', {
  variants: {
    size: {
      xs: 'size-3',
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
      xl: 'size-8',
      '2xl': 'size-10',
      '3xl': 'size-12',
      '4xl': 'size-16',
    },
    color: {
      default: 'text-current',
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      success: 'text-green-600 dark:text-green-400',
      error: 'text-destructive',
      warning: 'text-yellow-600 dark:text-yellow-400',
      info: 'text-blue-600 dark:text-blue-400',
      muted: 'text-muted-foreground',
      white: 'text-white',
      inherit: '',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'default',
  },
});

export interface IconProps extends VariantProps<typeof iconVariants> {
  icon: IconType;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

export function Icon({ icon: IconComponent, size, color, className, ...props }: IconProps) {
  return <IconComponent className={cn(iconVariants({ size, color }), className)} {...props} />;
}

export { iconVariants };
