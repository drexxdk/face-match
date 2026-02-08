import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gradient-primary text-white shadow-md hover:shadow-lg hover:scale-105',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/80 hover:scale-105',
        outline:
          'text-foreground border-2 border-primary text-primary hover:bg-primary hover:text-white hover:scale-105',
        success:
          'border-transparent bg-[hsl(142_76%_36%)] text-white shadow-md hover:bg-[hsl(142_76%_42%)] hover:scale-105',
        accent: 'border-transparent bg-accent text-white shadow-md hover:bg-accent/90 hover:scale-105',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
