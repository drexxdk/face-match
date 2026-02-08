import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { FaSpinner } from 'react-icons/fa6';

import { cn } from '@/lib/utils';
import { Icon } from './icon';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px touch-manipulation cursor-pointer disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] glow-primary',
        destructive:
          'bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:bg-destructive/90 glow-error',
        outline:
          'border-2 border-primary bg-card text-primary shadow-sm hover:bg-primary hover:text-white hover:scale-[1.02] active:scale-[0.98]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80 hover:scale-[1.02] active:scale-[0.98]',
        ghost: 'hover:bg-accent/10 hover:text-accent hover:scale-[1.02] active:scale-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline',
        success:
          'bg-[hsl(142_76%_36%)] text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:bg-[hsl(142_76%_42%)] glow-success',
        accent:
          'bg-accent text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:bg-accent/90 glow-accent',
      },
      size: {
        default: 'px-6 py-2.5 text-base min-h-[44px]',
        sm: 'px-4 py-2 text-sm min-h-[40px]',
        lg: 'px-8 py-3.5 text-lg min-h-[48px]',
        icon: 'size-12 min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && <Icon icon={FaSpinner} size="sm" className="animate-spin" aria-hidden />}
        {loading && <span className="sr-only">{loadingText || 'Loading...'}</span>}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
