import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const containerVariants = cva('flex w-full flex-1 flex-col', {
  variants: {
    spacing: {
      compact: 'gap-4',
      normal: 'gap-6',
      spacious: 'gap-12',
    },
    maxWidth: {
      none: '',
      md: 'max-w-screen-md mx-auto',
      lg: 'max-w-screen-lg mx-auto',
      xl: 'max-w-screen-xl mx-auto',
      '2xl': 'max-w-screen-2xl mx-auto',
    },
  },
  defaultVariants: {
    spacing: 'normal',
    maxWidth: 'none',
  },
});

interface PageContainerProps extends VariantProps<typeof containerVariants> {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, spacing, maxWidth, className }: PageContainerProps) {
  return <div className={cn(containerVariants({ spacing, maxWidth }), className)}>{children}</div>;
}
